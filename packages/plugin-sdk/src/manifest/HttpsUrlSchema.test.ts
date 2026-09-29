import { describe, expect, it } from 'vitest';
import { HttpsUrlSchema } from './HttpsUrlSchema';

describe('HttpsUrlSchema', () => {
  it('accepts an https address on a named host', () => {
    expect(HttpsUrlSchema.safeParse('https://anilist.co/api/v2/oauth/token').success).toBe(true);
  });

  it.each([
    'http://anilist.co',
    'javascript:alert(1)',
    'data:text/html,hi',
    'https://127.0.0.1/x',
    'not a url',
  ])('refuses %s', (address) => {
    expect(HttpsUrlSchema.safeParse(address).success).toBe(false);
  });
});
