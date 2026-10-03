import { describe, expect, it } from 'vitest';
import { fingerprintOf } from './fingerprintOf';

describe('fingerprintOf', () => {
  it('names a key by a short hash of it, the same every time', () => {
    const key = { kty: 'OKP', crv: 'Ed25519', x: 'MCowBQYDK2VwAyEA' } as const;

    expect(fingerprintOf(key)).toMatch(/^[0-9a-f]{32}$/u);
    expect(fingerprintOf(key)).toBe(fingerprintOf({ ...key }));
    expect(fingerprintOf(key)).not.toBe(fingerprintOf({ ...key, x: 'AAAAAAAAAAAAAAAA' }));
  });
});
