import { describe, expect, it } from 'vitest';
import { PasskeyCreationOptionsSchema } from './PasskeyCreationOptions';

const OPTIONS = {
  challenge: 'abc',
  rp: { name: 'Valence', id: 'valence.example' },
  user: { id: 'dXNlcg', name: 'Dan', displayName: 'Dan' },
  pubKeyCredParams: [
    { alg: -7, type: 'public-key' },
    { alg: -257, type: 'public-key' },
  ],
  excludeCredentials: [{ id: 'old', type: 'public-key' }],
  authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  attestation: 'none',
};

describe('PasskeyCreationOptionsSchema', () => {
  it('reads what a server asks a new passkey to be', () => {
    const read = PasskeyCreationOptionsSchema.parse(OPTIONS);

    expect(read.pubKeyCredParams.map(({ alg }) => alg)).toEqual([-7, -257]);
    expect(read.authenticatorSelection?.residentKey).toBe('preferred');
  });

  it('refuses options with nobody to make it for', () => {
    expect(PasskeyCreationOptionsSchema.safeParse({ ...OPTIONS, user: undefined }).success).toBe(
      false,
    );
  });
});
