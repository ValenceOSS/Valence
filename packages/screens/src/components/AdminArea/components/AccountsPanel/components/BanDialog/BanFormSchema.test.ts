import { describe, expect, it } from 'vitest';
import { BanFormSchema } from './BanFormSchema';

describe('BanFormSchema', () => {
  it('takes a reason, trimmed', () => {
    expect(BanFormSchema.parse({ reason: '  Shared their login ' })).toEqual({
      reason: 'Shared their login',
    });
  });

  it('needs a reason, since it is what they are told', () => {
    expect(BanFormSchema.safeParse({ reason: '  ' }).success).toBe(false);
  });

  it('keeps it short enough to read at the sign-in screen', () => {
    expect(BanFormSchema.safeParse({ reason: 'a'.repeat(201) }).error?.issues[0]?.message).toBe(
      'Keep it to 200 characters.',
    );
  });
});
