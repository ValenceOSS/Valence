import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { isPublicAddress } from '@ValenceCore/network/isPublicAddress';
import { openPinnedRequest } from '@ValenceCore/network/openPinnedRequest';
import type { PinnedAnswer, PinnedRequestInit } from '@ValenceCore/network/openPinnedRequest';
import type { GuardedFetch, GuardedInit } from '@ValenceRequests/network/GuardedFetch';
import type { GuardFor } from '@ValenceRequests/network/GuardFor';

type Reach = (url: string, init: GuardedInit) => Promise<Response>;

type Open = (
  address: string,
  init: PinnedRequestInit,
  signal: AbortSignal | undefined,
  allowsPrivateNetwork: boolean,
) => Promise<PinnedAnswer>;

type CreateGuardedFetchOptions = {
  fetch?: Reach;
  open?: Open;
  addressesOf?: (hostname: string) => Promise<string[]>;
};

const reachPlainly: Reach = (url, init) =>
  fetch(url, {
    ...(init.method === undefined ? {} : { method: init.method }),
    ...(init.headers === undefined ? {} : { headers: init.headers }),
    ...(init.body === undefined ? {} : { body: init.body }),
    ...(init.redirect === undefined ? {} : { redirect: init.redirect }),
    ...(init.signal === undefined ? {} : { signal: init.signal }),
  });

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

const WITHOUT_BODY = new Set([101, 204, 205, 304]);

const MOST_REDIRECTS = 5;

const openOnThePublicInternet: Open = (address, init, signal, allowsPrivateNetwork) =>
  openPinnedRequest(address, init, {
    hosts: 'any',
    userAgent: 'Valence-Requests',
    followRedirects: false,
    allowsHttp: true,
    allowsAnyPort: true,
    allowsPrivateNetwork,
    ...(signal === undefined ? {} : { signal }),
  });

const addressesFromDns = async (hostname: string): Promise<string[]> =>
  (await lookup(hostname, { all: true, verbatim: true })).map((found) => found.address);

/**
 * Whether a host the administrator configured sits on a private network, which is where somebody
 * running a catalogue or an indexer on a home server has it.
 *
 * @param host - The configured host, as `host:port`.
 * @param addressesOf - How to find the addresses a name leads to.
 * @returns Whether every address it has is off the public internet.
 */
const isOnPrivateNetwork = async (
  host: string,
  addressesOf: (hostname: string) => Promise<string[]>,
): Promise<boolean> => {
  const hostname = URL.parse(`http://${host}`)?.hostname.replace(/^\[(.*)\]$/, '$1') ?? '';
  const addresses = isIP(hostname) === 0 ? await addressesOf(hostname).catch(() => []) : [hostname];

  return addresses.length > 0 && addresses.every((address) => !isPublicAddress(address));
};

/**
 * Makes the fetch the requests service uses for any address it did not take from its own settings:
 * one that reaches the hosts the administrator configured for the job as they are, and every other
 * host only on a public address, resolved once and pinned for the request, with each redirect
 * checked the same way. Those other hosts are never given credentials, so they may be plain HTTP
 * and on any port; and where the configured host is itself on a private network, so may the
 * addresses of a home or office network. A configured host moving to HTTPS on its standard port is
 * still that host. A redirect is handed back unfollowed where the caller asked for that.
 *
 * @param options - The plain fetch for configured hosts, how to open a pinned request, and how to
 *   find what a name leads to.
 * @returns How to make a fetch that trusts the given hosts (as `host:port`) and no others.
 */
const createGuardedFetch =
  ({
    fetch: reach = reachPlainly,
    open = openOnThePublicInternet,
    addressesOf = addressesFromDns,
  }: CreateGuardedFetchOptions = {}): GuardFor =>
  (trustedHosts): GuardedFetch => {
    const trusted = new Set(trustedHosts.map((host) => host.toLowerCase()));
    const trustedNames = new Set(
      trustedHosts.map((host) => URL.parse(`http://${host}`)?.hostname.toLowerCase() ?? ''),
    );
    let onPrivateNetwork: Promise<boolean> | null = null;

    const isConfigured = (parsed: URL): boolean =>
      trusted.has(parsed.host.toLowerCase()) ||
      (parsed.protocol === 'https:' &&
        parsed.port === '' &&
        trustedNames.has(parsed.hostname.toLowerCase()));

    const isHomeServer = (): Promise<boolean> => {
      onPrivateNetwork ??= Promise.all(
        trustedHosts.map((host) => isOnPrivateNetwork(host, addressesOf)),
      ).then((verdicts) => verdicts.some(Boolean));

      return onPrivateNetwork;
    };

    return async (url, init) => {
      let current = url;
      let method = init.method ?? 'GET';
      let body = init.body;

      for (let hop = 0; hop <= MOST_REDIRECTS; hop += 1) {
        const parsed = URL.parse(current);

        if (parsed === null) {
          throw new TypeError('That is not an address');
        }

        const asked = { ...init, method, body, redirect: 'manual' as const };
        let response: Response;

        if (isConfigured(parsed)) {
          response = await reach(current, asked);
        } else {
          const known = METHODS.find((one) => one === method.toUpperCase());

          if (known === undefined) {
            throw new TypeError('That method is not one to make');
          }

          const answer = await open(
            current,
            {
              method: known,
              ...(init.headers === undefined ? {} : { headers: init.headers }),
              ...(body === undefined ? {} : { body }),
            },
            init.signal,
            await isHomeServer(),
          );

          if (WITHOUT_BODY.has(answer.status)) {
            answer.body.resume();
          }

          response = new Response(
            WITHOUT_BODY.has(answer.status) ? null : Readable.toWeb(answer.body),
            {
              status: answer.status,
              headers: answer.headers,
            },
          );
          Object.defineProperty(response, 'url', { value: answer.url.toString() });
        }

        const location = response.headers.get('location');

        if (init.redirect === 'manual' || location === null || !REDIRECTS.has(response.status)) {
          return response;
        }

        await response.body?.cancel().catch(() => undefined);
        current = new URL(location, current).toString();

        if (
          response.status === 303 ||
          ((response.status === 301 || response.status === 302) && method.toUpperCase() === 'POST')
        ) {
          method = 'GET';
          body = undefined;
        }
      }

      throw new Error('That went through too many redirects');
    };
  };

export type { CreateGuardedFetchOptions };

export { createGuardedFetch };
