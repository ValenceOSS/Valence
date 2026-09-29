import { describe, expect, it } from 'vitest';
import { PasskeyRequestOptionsSchema } from './PasskeyRequestOptions';

describe('PasskeyRequestOptionsSchema', () => {
  it('reads what a server asks a sign-in to sign', () => {
    const read = PasskeyRequestOptionsSchema.parse({
      challenge: 'abc',
      rpId: 'valence.example',
      timeout: 60_000,
      allowCredentials: [{ id: 'key', type: 'public-key', transports: ['internal'] }],
      userVerification: 'preferred',
      extensions: {},
    });

    expect(read.rpId).toBe('valence.example');
    expect(read.allowCredentials?.[0]?.id).toBe('key');
  });

  it('refuses options with nothing to sign', () => {
    expect(PasskeyRequestOptionsSchema.safeParse({ rpId: 'valence.example' }).success).toBe(false);
  });
});
