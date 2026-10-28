import { timingSafeEqual } from 'node:crypto';
import { scryptOf } from './scryptOf';

/**
 * Whether a password or PIN somebody typed is the one a hash was made from, compared in constant
 * time so how long it takes says nothing about how close it was.
 *
 * @param secret - What was typed.
 * @param kept - The hash it is checked against, as `hashSecret` writes it.
 * @returns Whether they match.
 */
const secretMatches = async (secret: string, kept: string): Promise<boolean> => {
  const [scheme, salt, hash] = kept.split('$');

  if (scheme !== 'scrypt' || salt === undefined || hash === undefined) {
    return false;
  }

  const wanted = Buffer.from(hash, 'base64url');
  const given = await scryptOf(secret, Buffer.from(salt, 'base64url'), wanted.length);

  return given.length === wanted.length && timingSafeEqual(given, wanted);
};

export { secretMatches };
