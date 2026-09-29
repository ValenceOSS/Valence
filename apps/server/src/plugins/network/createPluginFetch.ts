import { lookup as resolve } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import type { LookupAddress } from 'node:dns';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { isSafeWebhookUrl } from '@ValenceServer/webhooks/isSafeWebhookUrl';
import { isPublicAddress } from './isPublicAddress';

type PluginFetchInit = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
};

type PluginFetchResponse = {
  status: number;
  headers: Record<string, string>;
  text: string;
};

type Resolver = (
  hostname: string,
  answer: (error: Error | null, addresses: readonly LookupAddress[]) => void,
) => void;

type CreatePluginFetchOptions = {
  pluginId: string;
  hosts: readonly string[] | 'any';
  transport?: (
    options: RequestOptions,
    onResponse: (response: IncomingMessage) => void,
  ) => ClientRequest;
  resolver?: Resolver;
  isAllowedAddress?: (address: string) => boolean;
  port?: number;
  timeoutMilliseconds?: number;
  mostBytes?: number;
  mostRedirects?: number;
};

type PluginFetch = (url: string, init?: PluginFetchInit) => Promise<PluginFetchResponse>;

type PluginFetchBytes = (
  url: string,
) => Promise<{ status: number; headers: Record<string, string>; body: Buffer }>;

const REFUSED_HEADERS = new Set([
  'host',
  'cookie',
  'connection',
  'content-length',
  'transfer-encoding',
  'upgrade',
  'keep-alive',
  'te',
  'trailer',
  'proxy-authorization',
  'proxy-connection',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-real-ip',
]);

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/**
 * The only way a plugin reaches the internet: HTTPS to a host it named in its manifest and an
 * administrator allowed, on the standard port, with no credentials in the address. The name is
 * resolved as the connection is made and every answer must be a public address, so a host that
 * resolves — or is made to resolve — to this machine or its network is refused rather than
 * reached. Redirects are followed by hand and each hop is held to the same rules. Nothing of the
 * server's own travels with the request: no cookies, no forwarding headers, a user agent naming
 * the plugin. The answer is cut off at a size and a time, and cookies it sets are dropped.
 *
 * @param options - The plugin, its allowed hosts — or any public one, for what is checked by its
 *   signature rather than by where it came from — and the limits.
 * @returns The fetch the plugin's broker uses, and one that answers bytes for the picture proxy.
 */
const createPluginFetch = ({
  pluginId,
  hosts,
  transport = httpsRequest,
  resolver = (hostname, answer) => {
    resolve(hostname, { all: true, verbatim: true }, answer);
  },
  isAllowedAddress = isPublicAddress,
  port = 443,
  timeoutMilliseconds = 15_000,
  mostBytes = 5 * 1024 * 1024,
  mostRedirects = 3,
}: CreatePluginFetchOptions): { fetch: PluginFetch; fetchBytes: PluginFetchBytes } => {
  const allowed = new Set(hosts === 'any' ? [] : hosts.map((host) => host.toLowerCase()));

  const check = (address: string): URL => {
    const url = URL.parse(address);

    if (url === null || url.protocol !== 'https:') {
      throw new Error('A plugin may only fetch https addresses.');
    }

    if (url.username !== '' || url.password !== '') {
      throw new Error('A plugin may not put credentials in an address.');
    }

    if (url.port !== '' && url.port !== '443') {
      throw new Error('A plugin may only fetch on the standard port.');
    }

    if (
      (hosts !== 'any' && !allowed.has(url.hostname.toLowerCase())) ||
      !isSafeWebhookUrl(address)
    ) {
      throw new Error(`This plugin may not reach ${url.hostname}.`);
    }

    return url;
  };

  const once = (
    url: URL,
    init: PluginFetchInit,
  ): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> =>
    new Promise((settle, fail) => {
      const headers: Record<string, string> = { 'user-agent': `Valence-Plugin/${pluginId}` };

      for (const [name, value] of Object.entries(init.headers ?? {})) {
        const lower = name.toLowerCase();

        if (!REFUSED_HEADERS.has(lower) && !lower.startsWith('proxy-') && !/[\r\n]/.test(value)) {
          headers[lower] = value;
        }
      }

      if (init.body !== undefined) {
        headers['content-length'] = Buffer.byteLength(init.body).toString();
      }

      const outgoing = transport(
        {
          hostname: url.hostname,
          port,
          path: `${url.pathname}${url.search}`,
          method: init.method ?? 'GET',
          headers,
          servername: url.hostname,
          lookup: (hostname, options, answer) => {
            resolver(hostname, (error, addresses) => {
              if (error !== null) {
                answer(error, '', 4);

                return;
              }

              const safe = addresses.filter((each) => isAllowedAddress(each.address));

              if (safe.length === 0 || safe.length !== addresses.length) {
                answer(new Error(`${hostname} resolves somewhere a plugin may not reach.`), '', 4);

                return;
              }

              if (options.all === true) {
                answer(null, safe);

                return;
              }

              const first = safe[0];

              answer(null, first?.address ?? '', first?.family ?? 4);
            });
          },
        },
        (response) => {
          const parts: Buffer[] = [];

          let received = 0;
          let isRefused = false;

          response.on('data', (chunk: Buffer) => {
            if (isRefused) {
              return;
            }

            received += chunk.byteLength;

            if (received > mostBytes) {
              isRefused = true;
              fail(new Error('The answer was larger than a plugin may read.'));
              response.destroy();

              return;
            }

            parts.push(chunk);
          });
          response.on('end', () => {
            if (isRefused) {
              return;
            }

            const answered: Record<string, string> = {};

            for (const [name, value] of Object.entries(response.headers)) {
              if (name !== 'set-cookie' && value !== undefined) {
                answered[name] = Array.isArray(value) ? value.join(', ') : value;
              }
            }

            settle({
              status: response.statusCode ?? 0,
              headers: answered,
              body: Buffer.concat(parts),
            });
          });
          response.on('error', fail);
        },
      );

      outgoing.setTimeout(timeoutMilliseconds, () => {
        outgoing.destroy(new Error('The plugin’s request took too long.'));
      });
      outgoing.on('error', fail);
      outgoing.end(init.body);
    });

  const follow = async (
    address: string,
    init: PluginFetchInit,
  ): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> => {
    let url = check(address);
    let asked = init;

    for (let hop = 0; hop <= mostRedirects; hop += 1) {
      const answer = await once(url, asked);
      const location = answer.headers['location'];

      if (!REDIRECTS.has(answer.status) || location === undefined) {
        return answer;
      }

      url = check(new URL(location, url).toString());

      if (
        answer.status === 303 ||
        ((answer.status === 301 || answer.status === 302) && asked.method === 'POST')
      ) {
        asked = {
          method: 'GET',
          ...(asked.headers === undefined ? {} : { headers: asked.headers }),
        };
      }
    }

    throw new Error('The plugin’s request was redirected too many times.');
  };

  return {
    fetch: async (address, init = {}) => {
      const answer = await follow(address, init);

      return { status: answer.status, headers: answer.headers, text: answer.body.toString('utf8') };
    },
    fetchBytes: (address) => follow(address, {}),
  };
};

export type { PluginFetch, PluginFetchBytes, PluginFetchInit, PluginFetchResponse };

export { createPluginFetch };
