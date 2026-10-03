import { describe, expect, it } from 'vitest';
import { PasswordResetRequestSchema } from './PasswordResetRequest';

const BACK = 'https://valence.example/reset-password';

describe('PasswordResetRequestSchema', () => {
  it('takes a username or address somebody typed, trimmed', () => {
    expect(PasswordResetRequestSchema.parse({ identifier: '  ada ', redirectTo: BACK })).toEqual({
      identifier: 'ada',
      redirectTo: BACK,
    });
  });

  it('takes the face somebody picked instead', () => {
    const profileId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(PasswordResetRequestSchema.parse({ profileId, redirectTo: BACK })).toEqual({
      profileId,
      redirectTo: BACK,
    });
  });

  it('refuses a request that names nobody', () => {
    expect(
      PasswordResetRequestSchema.safeParse({ identifier: ' ', redirectTo: BACK }).success,
    ).toBe(false);
    expect(PasswordResetRequestSchema.safeParse({ redirectTo: BACK }).success).toBe(false);
    expect(
      PasswordResetRequestSchema.safeParse({ profileId: 'not-an-id', redirectTo: BACK }).success,
    ).toBe(false);
  });
});
