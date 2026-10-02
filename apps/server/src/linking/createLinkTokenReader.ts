import { decodeJwt, importJWK, jwtVerify } from 'jose';
import { LINK_TOKEN_SECONDS } from './LINK_TOKEN_SECONDS';
import type { PublicServerKey } from '@ValenceContracts/schemas/LinkedServer';

const CLOCK_SKEW_SECONDS = 30;

type LinkTokenReaderOptions = {
  me: () => Promise<string>;
  keyOf: (fingerprint: string) => Promise<PublicServerKey | null>;
  now?: () => number;
};

/**
 * Reads what another server says it is, from the token it signed: the token must be signed by the
 * key this server pinned for that server, meant for this server, fresh, and never seen before. A
 * token used twice is refused, so one overheard on the way cannot be replayed.
 *
 * @param me - This server's fingerprint, which every token must be addressed to.
 * @param keyOf - The pinned key of a server, by its fingerprint, or nothing where there is none.
 * @param now - The clock, in milliseconds.
 * @returns A reader that answers which server signed a token, or nothing where it should not be
 *   believed.
 */
const createLinkTokenReader = ({ me, keyOf, now = Date.now }: LinkTokenReaderOptions) => {
  const seen = new Map<string, number>();

  const forget = (atMs: number) => {
    for (const [id, until] of seen) {
      if (until <= atMs) {
        seen.delete(id);
      }
    }
  };

  return async (token: string): Promise<string | null> => {
    const atMs = now();

    forget(atMs);

    try {
      const claimed = decodeJwt(token);

      if (typeof claimed.iss !== 'string' || typeof claimed.jti !== 'string') {
        return null;
      }

      const key = await keyOf(claimed.iss);

      if (key === null || seen.has(claimed.jti)) {
        return null;
      }

      await jwtVerify(token, await importJWK(key, 'EdDSA'), {
        algorithms: ['EdDSA'],
        audience: await me(),
        issuer: claimed.iss,
        clockTolerance: CLOCK_SKEW_SECONDS,
        maxTokenAge: `${(LINK_TOKEN_SECONDS + CLOCK_SKEW_SECONDS).toString()}s`,
        currentDate: new Date(atMs),
      });

      seen.set(claimed.jti, atMs + (LINK_TOKEN_SECONDS + CLOCK_SKEW_SECONDS * 2) * 1000);

      return claimed.iss;
    } catch {
      return null;
    }
  };
};

export type { LinkTokenReaderOptions };

export { createLinkTokenReader };
