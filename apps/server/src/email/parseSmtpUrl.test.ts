import { describe, expect, it } from 'vitest';
import { parseSmtpUrl } from './parseSmtpUrl';

describe('parseSmtpUrl', () => {
  it('reads smtps as TLS from the start, with the credentials decoded', () => {
    expect(parseSmtpUrl('smtps://resend:re_a%2Fb@smtp.resend.com:465')).toEqual({
      host: 'smtp.resend.com',
      port: 465,
      security: 'tls',
      username: 'resend',
      password: 're_a/b',
    });
  });

  it('reads smtp as STARTTLS, or as nothing at all when asked', () => {
    expect(parseSmtpUrl('smtp://mail.example.com')).toMatchObject({
      port: 587,
      security: 'starttls',
      username: '',
      password: '',
    });
    expect(parseSmtpUrl('smtp://mail.example.com:25?security=none')).toMatchObject({
      port: 25,
      security: 'none',
    });
    expect(parseSmtpUrl('smtps://mail.example.com')).toMatchObject({ port: 465 });
  });

  it('refuses anything that is not an SMTP address', () => {
    expect(parseSmtpUrl('https://mail.example.com')).toBeNull();
    expect(parseSmtpUrl('not an address')).toBeNull();
  });
});
