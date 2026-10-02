import { describe, expect, it } from 'vitest';
import { validateAccount } from './validateAccount';
import type { AccountDraft } from './SetupWizard.types';

const GOOD: AccountDraft = {
  name: 'Operator',
  username: 'operator',
  email: '',
  password: 'a-long-enough-password',
  again: 'a-long-enough-password',
};

describe('validateAccount', () => {
  it('finds nothing wrong with a good account, with or without an address', () => {
    expect(validateAccount(GOOD)).toEqual({});
    expect(validateAccount({ ...GOOD, email: ' admin@valence.test ' })).toEqual({});
  });

  it('asks for a name when only spaces were typed', () => {
    expect(validateAccount({ ...GOOD, name: '   ' })).toEqual({
      name: 'Enter a name for the administrator account.',
    });
  });

  it('refuses a username that is too short or has other characters in it', () => {
    expect(validateAccount({ ...GOOD, username: 'op' }).username).toBe(
      'Choose a username to sign in with.',
    );
    expect(validateAccount({ ...GOOD, username: 'the operator' }).username).toBe(
      'Choose a username to sign in with.',
    );
  });

  it('refuses an address that is not one', () => {
    expect(validateAccount({ ...GOOD, email: 'not-an-address' })).toEqual({
      email: 'Enter a valid email address.',
    });
  });

  it('refuses a short password, and says how long it has to be', () => {
    expect(validateAccount({ ...GOOD, password: 'short', again: 'short' })).toEqual({
      password: 'Use at least 10 characters.',
    });
  });

  it('says when the password was typed differently the second time', () => {
    expect(validateAccount({ ...GOOD, again: 'something-else-entirely' })).toEqual({
      again: 'The two passwords are not the same.',
    });
  });

  it('reports every field that is wrong at once', () => {
    expect(
      Object.keys(
        validateAccount({ name: '', username: '', email: 'x', password: '', again: 'y' }),
      ).toSorted(),
    ).toEqual(['again', 'email', 'name', 'password', 'username']);
  });
});
