import { describe, expect, it } from 'vitest';
import { AddAccountFormSchema } from './AddAccountFormSchema';

const FILLED = {
  name: 'Ada',
  username: '',
  email: '',
  way: 'link' as const,
  password: '',
  lifetime: 7 as const,
};

const wrongIn = (form: typeof FILLED | (Omit<typeof FILLED, 'way'> & { way: 'password' })) => {
  const parsed = AddAccountFormSchema.safeParse(form);

  return parsed.success ? [] : parsed.error.issues.map((issue) => issue.path[0]);
};

describe('AddAccountFormSchema', () => {
  it('needs only a name to send a setup link', () => {
    expect(wrongIn(FILLED)).toEqual([]);
  });

  it('needs a name', () => {
    expect(wrongIn({ ...FILLED, name: ' ' })).toEqual(['name']);
  });

  it('takes an email address only where it is one', () => {
    expect(wrongIn({ ...FILLED, email: 'ada@example.com' })).toEqual([]);
    expect(wrongIn({ ...FILLED, email: 'ada' })).toEqual(['email']);
  });

  it('needs a long enough password only where one is being given', () => {
    expect(wrongIn({ ...FILLED, way: 'password', password: 'short' })).toEqual(['password']);
    expect(wrongIn({ ...FILLED, way: 'password', password: 'a-long-enough-password' })).toEqual([]);
  });

  it('judges a username only where one was typed', () => {
    expect(wrongIn({ ...FILLED, username: 'not ok!' })).toEqual(['username']);
  });
});
