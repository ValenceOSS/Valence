import { randomUUID } from 'node:crypto';
import { importJWK, SignJWT } from 'jose';
import { LINK_TOKEN_SECONDS } from './LINK_TOKEN_SECONDS';
import type { LinkTokenPerson } from './LinkTokenPerson';

type LinkTokenClaims = {
  from: string;
  to: string;
  privateKey: string;
  person?: LinkTokenPerson;
};

/**
 * Signs what one server says to another: who is saying it, who it is for, which of its people it is
 * asking for where it is asking for one, that it is good for a minute and no more, and an identifier
 * the other server remembers so it cannot be said twice.
 *
 * @param claims - This server's fingerprint, the other server's, this server's private key, and
 *   the person asked for, by pseudonym and by name where their name travels.
 * @returns The token, for an `Authorization: Bearer` header.
 */
const signLinkToken = async ({
  from,
  to,
  privateKey,
  person,
}: LinkTokenClaims): Promise<string> => {
  const signing = new SignJWT(
    person === undefined || person.name === null ? {} : { name: person.name },
  )
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuer(from)
    .setAudience(to)
    .setIssuedAt()
    .setExpirationTime(`${LINK_TOKEN_SECONDS.toString()}s`)
    .setJti(randomUUID());

  return (person === undefined ? signing : signing.setSubject(person.pseudonym)).sign(
    await importJWK(JSON.parse(privateKey), 'EdDSA'),
  );
};

export type { LinkTokenClaims };

export { signLinkToken };
