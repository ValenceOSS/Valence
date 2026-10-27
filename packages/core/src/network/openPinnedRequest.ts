import { lookup as resolve } from 'node:dns';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { LookupAddress } from 'node:dns';
import { isIP } from 'node:net';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { isHostAllowed } from './isHostAllowed';
import { isPublicAddress } from './isPublicAddress';
import { PinnedRequestRefusal } from './PinnedRequestRefusal';
import type { DevHost } from './readDevHosts';

type PinnedRequestInit = {
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | Buffer | undefined;
};

type PinnedAnswer = {
  status: number;
  headers: Record<string, string>;
  url: URL;
  body: IncomingMessage;
};

type Resolver = (
  hostname: string,
  answer: (error: Error | null, addresses: readonly LookupAddress[]) => void,
) => void;

type Transport = (
  options: RequestOptions,
  onResponse: (response: IncomingMessage) => void,
) => ClientRequest;

type OpenPinnedRequestOptions = {
  hosts: readonly string[] | 'any';
  userAgent: string;
  transport?: Transport;
  resolver?: Resolver;
  isAllowedAddress?: (address: string) => boolean;
  port?: number;
  devHosts?: ReadonlyMap<string, DevHost>;
  devTransport?: Transport;
  idleMilliseconds?: number;
  mostRedirects?: number;
  signal?: AbortSignal;
};

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
 * Opens an HTTPS request the way Valence reaches anywhere it was handed an address for: only to a
 * listed host, on the standard port, with no credentials in the address, and only once every
 * address the name resolves to has been found to be on the public internet — checked as the
 * connection is made, so a name cannot answer one address for the check and another for the
 * request, and for an address written as a number, before anything is sent to it. Redirects are
 * followed by hand and each hop is held to the same rules. Nothing of the server's own travels
 * with it: no cookies and no forwarding headers. The body is left unread for the caller to
 * stream, and the request gives up when nothing arrives for a while. A developer's stand-in host
 * is reached over plain HTTP at the address it was pointed at.
 *
 * @param address - Where to go.
 * @param init - The method, headers and body.
 * @param options - Which hosts may be reached, and the seams a test or a developer's machine needs.
 * @returns The answer, with the address it finally came from.
 */
const openPinnedRequest = async (
  address: string,
  init: PinnedRequestInit,
  {
    hosts,
    userAgent,
    transport = httpsRequest,
    resolver = (hostname, answer) => {
      resolve(hostname, { all: true, verbatim: true }, answer);
    },
    isAllowedAddress = isPublicAddress,
    port = 443,
    devHosts = new Map(),
    devTransport = httpRequest,
    idleMilliseconds = 15_000,
    mostRedirects = 3,
    signal,
  }: OpenPinnedRequestOptions,
): Promise<PinnedAnswer> => {
  const check = (candidate: string): URL => {
    const url = URL.parse(candidate);

    if (url === null || url.protocol !== 'https:') {
      throw new PinnedRequestRefusal('notHttps', url?.hostname ?? '');
    }

    if (url.username !== '' || url.password !== '') {
      throw new PinnedRequestRefusal('credentials', url.hostname);
    }

    if (url.port !== '' && url.port !== '443') {
      throw new PinnedRequestRefusal('port', url.hostname);
    }

    if (hosts !== 'any' && !isHostAllowed(url.hostname, hosts)) {
      throw new PinnedRequestRefusal('host', url.hostname);
    }

    const literal = url.hostname.replace(/^\[(.*)\]$/, '$1');

    if (isIP(literal) !== 0 && !isAllowedAddress(literal)) {
      throw new PinnedRequestRefusal('resolvesPrivately', url.hostname);
    }

    return url;
  };

  const once = (url: URL, asked: PinnedRequestInit): Promise<IncomingMessage> =>
    new Promise((settle, fail) => {
      const headers: Record<string, string> = { 'user-agent': userAgent };
      const dev = devHosts.get(url.hostname.toLowerCase());

      for (const [name, value] of Object.entries(asked.headers ?? {})) {
        const lower = name.toLowerCase();

        if (!REFUSED_HEADERS.has(lower) && !lower.startsWith('proxy-') && !/[\r\n]/.test(value)) {
          headers[lower] = value;
        }
      }

      if (asked.body !== undefined) {
        headers['content-length'] = Buffer.byteLength(asked.body).toString();
      }

      let answered: IncomingMessage | null = null;

      const outgoing = (dev === undefined ? transport : devTransport)(
        {
          hostname: url.hostname,
          port: dev?.port ?? port,
          path: `${url.pathname}${url.search}`,
          method: asked.method ?? 'GET',
          headers,
          ...(dev === undefined ? { servername: url.hostname } : {}),
          ...(signal === undefined ? {} : { signal }),
          lookup: (hostname, lookupOptions, answer) => {
            if (dev !== undefined) {
              const family = dev.address.includes(':') ? 6 : 4;

              if (lookupOptions.all === true) {
                answer(null, [{ address: dev.address, family }]);
              } else {
                answer(null, dev.address, family);
              }

              return;
            }

            resolver(hostname, (error, addresses) => {
              if (error !== null) {
                answer(error, '', 4);

                return;
              }

              const safe = addresses.filter((each) => isAllowedAddress(each.address));

              if (safe.length === 0 || safe.length !== addresses.length) {
                answer(new PinnedRequestRefusal('resolvesPrivately', hostname), '', 4);

                return;
              }

              if (lookupOptions.all === true) {
                answer(null, safe);

                return;
              }

              const first = safe[0];

              answer(null, first?.address ?? '', first?.family ?? 4);
            });
          },
        },
        (response) => {
          answered = response;
          settle(response);
        },
      );

      outgoing.setTimeout(idleMilliseconds, () => {
        const slow = new PinnedRequestRefusal('slow', url.hostname);

        answered?.destroy(slow);
        outgoing.destroy(slow);
      });
      outgoing.on('error', fail);
      outgoing.end(asked.body);
    });

  let url = check(address);
  let asked = init;

  for (let hop = 0; hop <= mostRedirects; hop += 1) {
    const response = await once(url, asked);
    const status = response.statusCode ?? 0;
    const location = response.headers.location;

    if (!REDIRECTS.has(status) || location === undefined) {
      const headers: Record<string, string> = {};

      for (const [name, value] of Object.entries(response.headers)) {
        if (name !== 'set-cookie' && value !== undefined) {
          headers[name] = Array.isArray(value) ? value.join(', ') : value;
        }
      }

      return { status, headers, url, body: response };
    }

    response.resume();
    url = check(new URL(location, url).toString());

    if (status === 303 || ((status === 301 || status === 302) && asked.method === 'POST')) {
      asked = { method: 'GET', ...(asked.headers === undefined ? {} : { headers: asked.headers }) };
    }
  }

  throw new PinnedRequestRefusal('redirects', url.hostname);
};

export type { OpenPinnedRequestOptions, PinnedAnswer, PinnedRequestInit, Resolver, Transport };

export { openPinnedRequest };
