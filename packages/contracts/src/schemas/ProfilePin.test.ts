import { describe, expect, it } from 'vitest';
import {
  ChooseProfileSchema,
  PinSchema,
  ProfileChoiceRefusalSchema,
  ProfilePinChangeSchema,
} from './ProfilePin';

describe('PinSchema', () => {
  it('reads four to eight digits', () => {
    expect(PinSchema.parse('1234')).toBe('1234');
    expect(PinSchema.parse('12345678')).toBe('12345678');
  });

  it('refuses fewer than four digits or more than eight', () => {
    expect(PinSchema.safeParse('123').success).toBe(false);
    expect(PinSchema.safeParse('123456789').success).toBe(false);
  });

  it('refuses anything that is not a digit', () => {
    expect(PinSchema.safeParse('12a4').success).toBe(false);
    expect(PinSchema.safeParse(' 1234').success).toBe(false);
    expect(PinSchema.safeParse('').success).toBe(false);
  });
});

describe('ChooseProfileSchema', () => {
  it('reads a choice with nothing in it', () => {
    expect(ChooseProfileSchema.parse({})).toEqual({});
  });

  it('reads a choice with a PIN, whatever it holds, so a wrong one is refused by the server', () => {
    expect(ChooseProfileSchema.parse({ pin: 'not a pin' }).pin).toBe('not a pin');
  });

  it('refuses a PIN longer than anybody would type', () => {
    expect(ChooseProfileSchema.safeParse({ pin: '1'.repeat(65) }).success).toBe(false);
  });

  it('reads a new PIN only where it is one', () => {
    expect(ChooseProfileSchema.parse({ newPin: '4321' }).newPin).toBe('4321');
    expect(ChooseProfileSchema.safeParse({ newPin: '43' }).success).toBe(false);
  });
});

describe('ProfilePinChangeSchema', () => {
  it('reads a new PIN', () => {
    expect(ProfilePinChangeSchema.parse({ pin: '9876' })).toEqual({ pin: '9876' });
  });

  it('reads a cleared PIN', () => {
    expect(ProfilePinChangeSchema.parse({ pin: null })).toEqual({ pin: null });
  });

  it('insists the PIN is said one way or the other', () => {
    expect(ProfilePinChangeSchema.safeParse({}).success).toBe(false);
    expect(ProfilePinChangeSchema.safeParse({ pin: 'abcd' }).success).toBe(false);
  });
});

describe('ProfileChoiceRefusalSchema', () => {
  it('reads a refusal that needs a PIN', () => {
    expect(
      ProfileChoiceRefusalSchema.parse({ error: 'Needs a PIN', code: 'x', needs: 'pin' }),
    ).toEqual({ error: 'Needs a PIN', code: 'x', values: {}, needs: 'pin' });
  });

  it('reads a refusal that needs a new PIN', () => {
    expect(ProfileChoiceRefusalSchema.parse({ error: 'Set a PIN', needs: 'newPin' }).needs).toBe(
      'newPin',
    );
  });

  it('reads a refusal that needs nothing, as an ordinary refusal', () => {
    const refusal = ProfileChoiceRefusalSchema.parse({ error: 'No' });

    expect(refusal.needs).toBeUndefined();
    expect(refusal.code).toBeNull();
  });

  it('refuses a need it does not know', () => {
    expect(ProfileChoiceRefusalSchema.safeParse({ error: 'No', needs: 'password' }).success).toBe(
      false,
    );
  });
});
