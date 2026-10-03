import { createHash } from 'node:crypto';
import type { PublicServerKey } from '@ValenceContracts/schemas/LinkedServer';

const FINGERPRINT_LENGTH = 32;

/**
 * The short name of a server's key: what its admin reads out to check an invite, what a token says
 * it came from and was meant for, and how one server tells another it already knows. A hash of the
 * key itself, so two servers agree on it without being told.
 *
 * @param key - The server's public key.
 * @returns Its fingerprint, as lowercase hex.
 */
const fingerprintOf = (key: PublicServerKey): string =>
  createHash('sha256')
    .update(Buffer.from(key.x, 'base64url'))
    .digest('hex')
    .slice(0, FINGERPRINT_LENGTH);

export { fingerprintOf };
