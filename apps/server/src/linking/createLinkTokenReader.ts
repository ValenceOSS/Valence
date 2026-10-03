import { z } from 'zod';
import { decodeJwt, importJWK, jwtVerify } from 'jose';
import { LINK_TOKEN_SECONDS } from './LINK_TOKEN_SECONDS';
import type { PublicServerKey } from '@ValenceContracts/schemas/LinkedServer';
import type { LinkTokenSigner } from './LinkTokenPerson';

const CLOCK_SKEW_SECONDS = 30;

const PersonClaimsSchema = z.object({
  sub: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(100).optional(),
});

type LinkTokenReaderOptions = {
  me: () => Promise<string>;
  keyOf: (fingerprint: string) => Promise<PublicServerKey | null>;
  now?: () => number;
};

/**
 * Reads what another server says it is, from the token it signed: the token must be signed by the
 * key this server pinned for that server, meant for this server, fresh, and never seen before. A
 * token used twice is refused, so one overheard on the way cannot be replayed. Where the token asks
 * for one of that server's people, it says who by their pseudonym, and their name where it travels;
 * a token that names a person badly is not believed at all.
 *
 * @param me - This server's fingerprint, which every token must be addressed to.
 * @param keyOf - The pinned key of a server, by its fingerprint, or nothing where there is none.
 * @param now - The clock, in milliseconds.
 * @returns A reader that answers which server signed a token and for whom, or nothing where it
 *   should not be believed.
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

  return async (token: string): Promise<LinkTokenSigner | null> => {
    const atMs = now();

    forget(atMs);

    try {
      const claimed = decodeJwt(token);
      const person = PersonClaimsSchema.safeParse(claimed);

      if (typeof claimed.iss !== 'string' || typeof claimed.jti !== 'string' || !person.success) {
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

      return {
        from: claimed.iss,
        person:
          person.data.sub === undefined
            ? null
            : { pseudonym: person.data.sub, name: person.data.name ?? null },
      };
    } catch {
      return null;
    }
  };
};

export type { LinkTokenReaderOptions };

export { createLinkTokenReader };
