import { createPublicKey } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { OFFICIAL_PLUGIN_KEYS } from './OFFICIAL_PLUGIN_KEYS';

describe('the keys official plugins are signed with', () => {
  it('holds only Ed25519 public keys', () => {
    const keys = Object.values(OFFICIAL_PLUGIN_KEYS);

    expect(keys.length).toBeGreaterThan(0);

    for (const pem of keys) {
      expect(createPublicKey(pem).asymmetricKeyType).toBe('ed25519');
    }
  });
});
