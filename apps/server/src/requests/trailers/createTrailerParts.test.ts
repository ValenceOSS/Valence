import { describe, expect, it } from 'vitest';
import { createTrailerParts } from './createTrailerParts';

describe('createTrailerParts', () => {
  it('serves each of YouTube’s addresses under the token it was given for', () => {
    const parts = createTrailerParts(() => 0);
    const token = parts.open();
    const playlist = parts.addressOf(token, 'https://manifest.googlevideo.com/a', true);
    const piece = parts.addressOf(token, 'https://rr1.googlevideo.com/b', false);

    expect(playlist).toBe(`/api/requests/trailers/${token}/1.m3u8`);
    expect(piece).toBe(`/api/requests/trailers/${token}/2`);
    expect(parts.urlOf(token, '1.m3u8')).toBe('https://manifest.googlevideo.com/a');
    expect(parts.urlOf(token, '2')).toBe('https://rr1.googlevideo.com/b');
  });

  it('numbers an address it has seen before the same way', () => {
    const parts = createTrailerParts(() => 0);
    const token = parts.open();

    expect(parts.addressOf(token, 'https://x/a', false)).toBe(
      parts.addressOf(token, 'https://x/a', false),
    );
  });

  it('stands for nothing but what YouTube gave it', () => {
    const parts = createTrailerParts(() => 0);
    const token = parts.open();

    parts.addressOf(token, 'https://x/a', false);

    expect(parts.urlOf(token, '7')).toBeNull();
    expect(parts.urlOf(token, '../etc/passwd')).toBeNull();
    expect(parts.urlOf('not-a-token', '1')).toBeNull();
  });

  it('lets a token go after a few hours', () => {
    let at = 0;
    const parts = createTrailerParts(() => at);
    const token = parts.open();

    parts.addressOf(token, 'https://x/a', false);
    at = 7 * 60 * 60 * 1000;

    expect(parts.urlOf(token, '1')).toBeNull();
  });
});
