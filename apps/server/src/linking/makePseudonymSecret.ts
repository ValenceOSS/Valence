import { randomBytes } from 'node:crypto';

/**
 * Makes the secret this server turns its people into pseudonyms with, so that no other server can
 * work back from a pseudonym to who it is, or match one person across two servers.
 *
 * @returns The secret.
 */
const makePseudonymSecret = (): string => randomBytes(32).toString('base64url');

export { makePseudonymSecret };
