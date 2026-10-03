import { hkdfSync } from 'node:crypto';

/**
 * A key secrets are sealed with, derived from the server's own secret so an operator has nothing
 * new to keep, and bound to one purpose so no two kinds of secret ever share a key. Plugin secrets
 * are the purpose where none is named, which is the key they have always been sealed with.
 *
 * @param serverSecret - The secret the server signs its sessions with.
 * @param purpose - What the key seals.
 * @returns A 32-byte key.
 */
const sealingKeyFrom = (serverSecret: string, purpose = 'valence-plugin-secrets'): Buffer =>
  Buffer.from(hkdfSync('sha256', serverSecret, 'valence', purpose, 32));

export { sealingKeyFrom };
