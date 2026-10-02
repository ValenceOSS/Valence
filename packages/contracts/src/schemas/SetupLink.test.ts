import { describe, expect, it } from 'vitest';
import { SetupLinkLifetimeSchema, SetupRedemptionSchema, UsernameSchema } from './SetupLink';

describe('SetupLink', () => {
  it('offers a link for one, seven or thirty days and nothing else', () => {
    expect(SetupLinkLifetimeSchema.safeParse(7).success).toBe(true);
    expect(SetupLinkLifetimeSchema.safeParse(3).success).toBe(false);
  });

  it('takes a username of letters, digits, dots and underscores', () => {
    expect(UsernameSchema.safeParse('Ada.L_1').success).toBe(true);
    expect(UsernameSchema.safeParse('ad').success).toBe(false);
    expect(UsernameSchema.safeParse('has space').success).toBe(false);
    expect(UsernameSchema.safeParse('a'.repeat(31)).success).toBe(false);
  });

  it('wants a password as long as signing in does, when one is given', () => {
    expect(SetupRedemptionSchema.safeParse({}).success).toBe(true);
    expect(SetupRedemptionSchema.safeParse({ password: 'short' }).success).toBe(false);
  });
});
