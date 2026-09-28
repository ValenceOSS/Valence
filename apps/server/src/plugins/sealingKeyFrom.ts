import { hkdfSync } from 'node:crypto';

/**
 * The key plugin secrets are sealed with, derived from the server's own secret so an operator has
 * nothing new to keep, and bound to this one purpose so it is never the key anything else uses.
 *
 * @param serverSecret - The secret the server signs its sessions with.
 * @returns A 32-byte key.
 */
const sealingKeyFrom = (serverSecret: string): Buffer =>
  Buffer.from(hkdfSync('sha256', serverSecret, 'valence', 'valence-plugin-secrets', 32));

export { sealingKeyFrom };
