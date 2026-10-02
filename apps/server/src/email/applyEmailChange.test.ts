import { describe, expect, it } from 'vitest';
import { EMAIL_DEFAULTS } from '@ValenceContracts/schemas/EmailSettings';
import { applyEmailChange } from './applyEmailChange';

const CURRENT = { ...EMAIL_DEFAULTS, username: 'me', password: 'secret' };

const CHANGE = {
  isEnabled: true,
  host: ' smtp.example.com ',
  port: 465,
  security: 'tls',
  username: 'me',
  password: '',
  fromName: ' Valence ',
  fromAddress: ' v@example.com ',
  sendsPasswordResets: true,
  sendsSetupLinks: false,
} as const;

describe('applyEmailChange', () => {
  it('keeps the saved password when none is given, trimming what was typed', () => {
    expect(applyEmailChange(CURRENT, CHANGE)).toEqual({
      isEnabled: true,
      host: 'smtp.example.com',
      port: 465,
      security: 'tls',
      username: 'me',
      password: 'secret',
      fromName: 'Valence',
      fromAddress: 'v@example.com',
      sendsPasswordResets: true,
      sendsSetupLinks: false,
    });
  });

  it('replaces the password when a new one is given, and drops it with the username', () => {
    expect(applyEmailChange(CURRENT, { ...CHANGE, password: 'new' }).password).toBe('new');
    expect(applyEmailChange(CURRENT, { ...CHANGE, username: '', password: 'x' }).password).toBe('');
  });
});
