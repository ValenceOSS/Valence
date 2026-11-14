import { describe, expect, it } from 'vitest';
import { isSingleMagnetLink } from '@ValenceRequests/indexers/isSingleMagnetLink';

describe('isSingleMagnetLink', () => {
  it('accepts one magnet link', () => {
    expect(
      isSingleMagnetLink('magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=A'),
    ).toBe(true);
  });

  it.each([
    [
      'a second address on a new line',
      'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567\nhttp://10.0.0.5/x',
    ],
    ['a carriage return', 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567\r\nx'],
    ['a space', 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567 http://x'],
    ['no magnet scheme', 'http://example.com/'],
  ])('refuses %s', (_name, text) => {
    expect(isSingleMagnetLink(text)).toBe(false);
  });
});
