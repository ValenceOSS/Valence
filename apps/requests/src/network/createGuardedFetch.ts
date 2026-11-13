import { Readable } from 'node:stream';
import { openPinnedRequest } from '@ValenceCore/network/openPinnedRequest';
import type { PinnedAnswer, PinnedRequestInit } from '@ValenceCore/network/openPinnedRequest';
import type { GuardedFetch, GuardedInit } from '@ValenceRequests/network/GuardedFetch';
import type { GuardFor } from '@ValenceRequests/network/GuardFor';

type Reach = (url: string, init: GuardedInit) => Promise<Response>;

type Open = (
  address: string,
  init: PinnedRequestInit,
  signal?: AbortSignal,
) => Promise<PinnedAnswer>;

type CreateGuardedFetchOptions = {
  fetch?: Reach;
  open?: Open;
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

const openOnThePublicInternet: Open = (address, init, signal) =>
  openPinnedRequest(address, init, {
    hosts: 'any',
    userAgent: 'Valence-Requests',
    followRedirects: false,
    ...(signal === undefined ? {} : { signal }),
  });

/**
 * Makes the fetch the requests service uses for any address it did not take from its own settings:
 * one that reaches the hosts the administrator configured for the job as they are, and every other
 * host only over HTTPS on a public address, resolved once and pinned for the request, with each
 * redirect checked the same way. A redirect is handed back unfollowed where the caller asked for
 * that.
 *
 * @param options - The plain fetch for configured hosts, and how to open a pinned request.
 * @returns How to make a fetch that trusts the given hosts (as `host:port`) and no others.
 */
const createGuardedFetch =
  ({
    fetch: reach = reachPlainly,
    open = openOnThePublicInternet,
  }: CreateGuardedFetchOptions = {}): GuardFor =>
  (trustedHosts): GuardedFetch => {
    const trusted = new Set(trustedHosts.map((host) => host.toLowerCase()));

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

        if (trusted.has(parsed.host.toLowerCase())) {
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
