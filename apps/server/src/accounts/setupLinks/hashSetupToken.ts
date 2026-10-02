import { createHash } from 'node:crypto';

/**
 * Hashes a setup link's token for keeping, so the database never holds a link that works.
 *
 * @param token - The token from the link.
 * @returns Its SHA-256, in hex.
 */
const hashSetupToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export { hashSetupToken };
