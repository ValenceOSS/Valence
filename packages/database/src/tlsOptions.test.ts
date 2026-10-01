import { describe, expect, it } from 'vitest';
import { tlsOptions } from './tlsOptions';

const READ = (path: string): string => `certificate from ${path}`;

describe('tlsOptions', () => {
  it('asks for nothing where TLS is off', () => {
    expect(tlsOptions({ mode: 'off', ca: null }, READ)).toBeUndefined();
  });

  it('encrypts without checking who answers when TLS is only required', () => {
    expect(tlsOptions({ mode: 'require', ca: null }, READ)).toEqual({ rejectUnauthorized: false });
  });

  it('checks the server against the certificate it was given when asked to verify it', () => {
    expect(tlsOptions({ mode: 'verify-full', ca: '/certs/ca.pem' }, READ)).toEqual({
      rejectUnauthorized: true,
      ca: 'certificate from /certs/ca.pem',
    });
  });
});
