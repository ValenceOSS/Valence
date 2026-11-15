import { isIP } from 'node:net';
import { Agent, fetch } from 'undici';
import { createPinnedLookup } from './createPinnedLookup';
import { isDecodedByFetch } from './isDecodedByFetch';
import type { Resolve } from '@ValenceServer/live/isPublicWebAddress';

type PinnedInit = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  method?: string;
  body?: string | ArrayBuffer;
  redirect?: 'manual';
};

const WITHOUT_BODY = new Set([101, 204, 205, 304]);

/**
 * Builds a fetch that resolves a name once, checks every address it leads to and connects to one
 * that passed, so a name that changes between the check and the connection gains nothing. An
 * address written as a number is checked before connecting. It follows no redirect. Connections
 * are kept and used again while the other end keeps them open, each made only after its address
 * passed. It speaks HTTP/1.1 alone, since undici's HTTP/2 held one long answer from a server across
 * Europe to about fifty megabits on gigabit links at both ends. A body undici has decoded is handed
 * on without the coding and length that described it before.
 *
 * @param isAllowed - Whether a resolved address may be connected to.
 * @param whyRefused - The error to throw when none of the addresses of a host may be.
 * @param resolve - What a name resolves to, in place of the system's lookup, injectable for tests.
 * @returns A fetch that connects only to allowed addresses.
 */
const createPinnedFetch = (
  isAllowed: (address: string) => boolean,
  whyRefused: (addresses: readonly string[]) => Error,
  resolve?: Resolve,
) => {
  const refusals = new WeakSet<Error>();
  const refused = (addresses: readonly string[]): Error => {
    const refusal = whyRefused(addresses);

    refusals.add(refusal);

    return refusal;
  };
  const agent = new Agent({
    allowH2: false,
    connect: { lookup: createPinnedLookup(isAllowed, refused, resolve) },
  });

  return async (url: string, init: PinnedInit = {}): Promise<Response> => {
    const host = URL.parse(url)?.hostname.replace(/^\[|\]$/g, '') ?? '';

    if (isIP(host) !== 0 && !isAllowed(host)) {
      throw whyRefused([host]);
    }

    try {
      const answer = await fetch(url, { ...init, redirect: 'manual', dispatcher: agent });
      const { body } = answer;
      const isDecoded = isDecodedByFetch(answer.headers.get('content-encoding'));
      const meta = {
        status: answer.status,
        statusText: answer.statusText,
        headers: [...answer.headers].filter(
          ([name]) => !isDecoded || (name !== 'content-encoding' && name !== 'content-length'),
        ),
      };

      if (body === null || WITHOUT_BODY.has(answer.status)) {
        await body?.cancel();

        return new Response(null, meta);
      }

      return new Response(body.pipeThrough(new TransformStream()), meta);
    } catch (error) {
      throw error instanceof Error && error.cause instanceof Error && refusals.has(error.cause)
        ? error.cause
        : error;
    }
  };
};

export { createPinnedFetch };
