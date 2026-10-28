import { randomBytes } from 'node:crypto';
import { scryptOf } from './scryptOf';

/**
 * Keeps a password or PIN as something that can be checked against and never read back: a salted
 * scrypt hash, with the salt written beside it.
 *
 * @param secret - The password or PIN.
 * @returns The hash, as `scrypt$<salt>$<hash>`.
 */
const hashSecret = async (secret: string): Promise<string> => {
  const salt = randomBytes(16);
  const hash = await scryptOf(secret, salt, 32);

  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
};

export { hashSecret };
