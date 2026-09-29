import { describe, expect, it } from 'vitest';
import { PasskeyAssertionSchema } from './PasskeyAssertion';

describe('PasskeyAssertionSchema', () => {
  it('reads a signed sign-in', () => {
    const read = PasskeyAssertionSchema.parse({
      id: 'key',
      rawId: 'key',
      type: 'public-key',
      response: { clientDataJSON: 'e30', authenticatorData: 'AA', signature: 'AA' },
    });

    expect(read.response.userHandle).toBeUndefined();
  });

  it('refuses one without a signature', () => {
    expect(
      PasskeyAssertionSchema.safeParse({
        id: 'key',
        rawId: 'key',
        type: 'public-key',
        response: { clientDataJSON: 'e30', authenticatorData: 'AA' },
      }).success,
    ).toBe(false);
  });
});
