import { isIP } from 'node:net';
import { Agent, fetch } from 'undici';
import { createPinnedLookup } from './createPinnedLookup';

type PinnedInit = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  method?: string;
  body?: string;
  redirect?: 'manual';
};

const WITHOUT_BODY = new Set([101, 204, 205, 304]);

/**
 * Builds a fetch that resolves a name once, checks every address it leads to and connects to one
 * that passed, so a name that changes between the check and the connection gains nothing. An
 * address written as a number is checked before connecting. It follows no redirect.
 *
 * @param isAllowed - Whether a resolved address may be connected to.
 * @param whyRefused - The error to throw when none of the addresses of a host may be.
 * @returns A fetch that connects only to allowed addresses.
 */
const createPinnedFetch =
  (isAllowed: (address: string) => boolean, whyRefused: (addresses: readonly string[]) => Error) =>
  async (url: string, init: PinnedInit = {}): Promise<Response> => {
    const host = URL.parse(url)?.hostname.replace(/^\[|\]$/g, '') ?? '';

    if (isIP(host) !== 0 && !isAllowed(host)) {
      throw whyRefused([host]);
    }

    const agent = new Agent({ connect: { lookup: createPinnedLookup(isAllowed, whyRefused) } });

    try {
      const answer = await fetch(url, { ...init, redirect: 'manual', dispatcher: agent });
      const { body } = answer;
      const meta = {
        status: answer.status,
        statusText: answer.statusText,
        headers: [...answer.headers],
      };

      if (body === null || WITHOUT_BODY.has(answer.status)) {
        await body?.cancel();
        void agent.close();

        return new Response(null, meta);
      }

      const chunks = async function* () {
        try {
          for await (const chunk of body) {
            yield chunk;
          }
        } finally {
          void agent.close();
        }
      };

      return new Response(ReadableStream.from(chunks()), meta);
    } catch (error) {
      void agent.close();

      throw error;
    }
  };

export { createPinnedFetch };
