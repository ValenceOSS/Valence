import { randomUUID } from 'node:crypto';
import { importJWK, SignJWT } from 'jose';
import { LINK_TOKEN_SECONDS } from './LINK_TOKEN_SECONDS';

type LinkTokenClaims = {
  from: string;
  to: string;
  privateKey: string;
};

/**
 * Signs what one server says to another: who is saying it, who it is for, that it is good for a
 * minute and no more, and an identifier the other server remembers so it cannot be said twice.
 *
 * @param claims - This server's fingerprint, the other server's, and this server's private key.
 * @returns The token, for an `Authorization: Bearer` header.
 */
const signLinkToken = async ({ from, to, privateKey }: LinkTokenClaims): Promise<string> =>
  new SignJWT({})
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuer(from)
    .setAudience(to)
    .setIssuedAt()
    .setExpirationTime(`${LINK_TOKEN_SECONDS.toString()}s`)
    .setJti(randomUUID())
    .sign(await importJWK(JSON.parse(privateKey), 'EdDSA'));

export type { LinkTokenClaims };

export { signLinkToken };
