import { describe, expect, it } from 'vitest';
import { linkIntoTheApp } from './linkIntoTheApp';
import { readALinkIntoTheApp } from './readALinkIntoTheApp';

const SERVER = 'https://valence.example:8420';

describe('linkIntoTheApp', () => {
  it('carries the code a television is waiting on, and the server it asked', () => {
    expect(linkIntoTheApp({ televisionCode: 'abcd-1234' }, SERVER)).toBe(
      'valence://device?user_code=ABCD1234&server=https%3A%2F%2Fvalence.example%3A8420',
    );
  });

  it('simply opens the app from anywhere else', () => {
    expect(linkIntoTheApp({ televisionCode: null }, SERVER)).toBe(
      'valence://open?server=https%3A%2F%2Fvalence.example%3A8420',
    );
  });

  it('is read back as it was written', () => {
    expect(readALinkIntoTheApp(linkIntoTheApp({ televisionCode: 'ABCD1234' }, SERVER))).toEqual({
      kind: 'device',
      code: 'ABCD1234',
      server: SERVER,
    });
    expect(readALinkIntoTheApp(linkIntoTheApp({ televisionCode: null }, SERVER))).toEqual({
      kind: 'open',
      server: SERVER,
    });
  });
});
