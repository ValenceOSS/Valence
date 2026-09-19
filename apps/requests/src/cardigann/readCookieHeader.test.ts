import { describe, expect, it } from 'vitest';
import { readCookieHeader } from './readCookieHeader';

describe('readCookieHeader', () => {
  it('reads each cookie by name', () => {
    expect(readCookieHeader('uid=1; pass=abc123;  theme=dark')).toEqual({
      uid: '1',
      pass: 'abc123',
      theme: 'dark',
    });
  });

  it('leaves out attributes that are not cookies', () => {
    expect(readCookieHeader('session=x; Path=/; HttpOnly; Max-Age=60; SameSite=Lax')).toEqual({
      session: 'x',
    });
  });

  it('reads nothing from nothing', () => {
    expect(readCookieHeader('')).toEqual({});
  });
});
