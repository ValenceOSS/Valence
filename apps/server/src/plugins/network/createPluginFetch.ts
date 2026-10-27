import { isSafeWebhookUrl } from '@ValenceServer/webhooks/isSafeWebhookUrl';
import { openPinnedRequest } from '@ValenceCore/network/openPinnedRequest';
import { PinnedRequestRefusal } from '@ValenceCore/network/PinnedRequestRefusal';
import type { Resolver, Transport } from '@ValenceCore/network/openPinnedRequest';
import type { DevHost } from '@ValenceCore/network/readDevHosts';

type PluginFetchInit = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | Buffer | undefined;
};

type PluginFetchResponse = {
  status: number;
  headers: Record<string, string>;
  text: string;
};

type CreatePluginFetchOptions = {
  pluginId: string;
  hosts: readonly string[] | 'any';
  transport?: Transport;
  resolver?: Resolver;
  isAllowedAddress?: (address: string) => boolean;
  port?: number;
  devHosts?: ReadonlyMap<string, DevHost>;
  timeoutMilliseconds?: number;
  mostBytes?: number;
  mostRedirects?: number;
};

type PluginFetch = (url: string, init?: PluginFetchInit) => Promise<PluginFetchResponse>;

type PluginFetchBytes = (
  url: string,
) => Promise<{ status: number; headers: Record<string, string>; body: Buffer }>;

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
  transport,
  resolver,
  isAllowedAddress,
  port,
  devHosts,
  timeoutMilliseconds = 15_000,
  mostBytes = 5 * 1024 * 1024,
  mostRedirects = 3,
}: CreatePluginFetchOptions): { fetch: PluginFetch; fetchBytes: PluginFetchBytes } => {
  const refuse = (refusal: PinnedRequestRefusal): never => {
    switch (refusal.reason) {
      case 'notHttps':
        throw new Error('A plugin may only fetch https addresses.', { cause: refusal });
      case 'credentials':
        throw new Error('A plugin may not put credentials in an address.', { cause: refusal });
      case 'port':
        throw new Error('A plugin may only fetch on the standard port.', { cause: refusal });
      case 'host':
        throw new Error(`This plugin may not reach ${refusal.hostname}.`, { cause: refusal });
      case 'resolvesPrivately':
        throw new Error(`${refusal.hostname} resolves somewhere a plugin may not reach.`, {
          cause: refusal,
        });
      case 'redirects':
        throw new Error('The plugin’s request was redirected too many times.', { cause: refusal });
      case 'slow':
        throw new Error('The plugin’s request took too long.', { cause: refusal });
    }
  };

  const follow = async (
    address: string,
    init: PluginFetchInit,
  ): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> => {
    const parsed = URL.parse(address);

    if (parsed !== null && parsed.protocol === 'https:' && !isSafeWebhookUrl(address)) {
      throw new Error(`This plugin may not reach ${parsed.hostname}.`);
    }

    try {
      const answer = await openPinnedRequest(address, init, {
        hosts,
        userAgent: `Valence-Plugin/${pluginId}`,
        ...(transport === undefined ? {} : { transport }),
        ...(resolver === undefined ? {} : { resolver }),
        ...(isAllowedAddress === undefined ? {} : { isAllowedAddress }),
        ...(port === undefined ? {} : { port }),
        ...(devHosts === undefined ? {} : { devHosts }),
        idleMilliseconds: timeoutMilliseconds,
        mostRedirects,
      });
      const parts: Buffer[] = [];

      let received = 0;

      for await (const chunk of answer.body) {
        const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));

        received += part.byteLength;

        if (received > mostBytes) {
          answer.body.destroy();
          throw new Error('The answer was larger than a plugin may read.');
        }

        parts.push(part);
      }

      return { status: answer.status, headers: answer.headers, body: Buffer.concat(parts) };
    } catch (error) {
      if (error instanceof PinnedRequestRefusal) {
        refuse(error);
      }

      throw error;
    }
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
