import { randomBytes, scryptSync } from 'node:crypto';

const COST = 16_384;

/**
 * Keeps a password or PIN as something that can be checked against and never read back: a salted
 * scrypt hash, with the salt written beside it.
 *
 * @param secret - The password or PIN.
 * @returns The hash, as `scrypt$<salt>$<hash>`.
 */
const hashSecret = (secret: string): string => {
  const salt = randomBytes(16);
  const hash = scryptSync(secret.normalize('NFKC'), salt, 32, { N: COST });

  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
};

export { hashSecret };
