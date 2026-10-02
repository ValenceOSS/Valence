import { describe, expect, it } from 'vitest';
import { EMAIL_DEFAULTS } from '@ValenceContracts/schemas/EmailSettings';
import { readEmailConnection } from './readEmailConnection';

const SAVED = {
  ...EMAIL_DEFAULTS,
  host: ' smtp.example.com ',
  port: 587,
  username: 'me',
  password: 'secret',
  fromName: 'Valence',
  fromAddress: 'valence@example.com',
};

const NO_ENVIRONMENT = { smtpUrl: '', smtpFrom: '' };

describe('readEmailConnection', () => {
  it('uses what was saved when the environment says nothing', () => {
    expect(readEmailConnection(SAVED, NO_ENVIRONMENT)).toEqual({
      host: 'smtp.example.com',
      port: 587,
      security: 'starttls',
      username: 'me',
      password: 'secret',
      fromName: 'Valence',
      fromAddress: 'valence@example.com',
    });
  });

  it('has nothing to send through without a server or a sender', () => {
    expect(readEmailConnection(EMAIL_DEFAULTS, NO_ENVIRONMENT)).toBeNull();
    expect(readEmailConnection({ ...SAVED, fromAddress: '' }, NO_ENVIRONMENT)).toBeNull();
  });

  it('lets the environment decide over what was saved', () => {
    expect(
      readEmailConnection(SAVED, {
        smtpUrl: 'smtps://resend:key@smtp.resend.com',
        smtpFrom: 'Home <home@example.org>',
      }),
    ).toEqual({
      host: 'smtp.resend.com',
      port: 465,
      security: 'tls',
      username: 'resend',
      password: 'key',
      fromName: 'Home',
      fromAddress: 'home@example.org',
    });
    expect(
      readEmailConnection(SAVED, { smtpUrl: 'smtps://smtp.resend.com', smtpFrom: '' }),
    ).toBeNull();
    expect(readEmailConnection(SAVED, { smtpUrl: 'nonsense', smtpFrom: 'a@b.c' })).toBeNull();
  });
});
