import { createHash } from 'node:crypto';

/**
 * The SHA-256 digest of some bytes, written as lower-case hex.
 *
 * @param bytes - What to digest.
 * @returns The digest.
 */
const sha256Of = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

export { sha256Of };
