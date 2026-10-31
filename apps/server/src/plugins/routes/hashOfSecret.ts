import { createHash } from 'node:crypto';

/**
 * The hash a credential's secret is found by, so the secret itself is never what is looked up.
 *
 * @param secret - The secret.
 * @returns Its SHA-256, in hex.
 */
const hashOfSecret = (secret: string): string =>
  createHash('sha256').update(secret, 'utf8').digest('hex');

export { hashOfSecret };
