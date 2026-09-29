import { describe, expect, it } from 'vitest';
import { PasskeyAttestationSchema } from './PasskeyAttestation';

describe('PasskeyAttestationSchema', () => {
  it('reads a new passkey', () => {
    const read = PasskeyAttestationSchema.parse({
      id: 'key',
      rawId: 'key',
      type: 'public-key',
      response: { clientDataJSON: 'e30', attestationObject: 'AA', transports: ['internal'] },
    });

    expect(read.response.transports).toEqual(['internal']);
  });

  it('refuses one without its attestation', () => {
    expect(
      PasskeyAttestationSchema.safeParse({
        id: 'key',
        rawId: 'key',
        type: 'public-key',
        response: { clientDataJSON: 'e30', transports: [] },
      }).success,
    ).toBe(false);
  });
});
