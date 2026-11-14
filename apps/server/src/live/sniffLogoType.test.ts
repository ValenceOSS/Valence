import { describe, expect, it } from 'vitest';
import { sniffLogoType } from './sniffLogoType';

const text = (value: string) => new TextEncoder().encode(value);

describe('sniffLogoType', () => {
  it('knows the pictures a channel logo is', () => {
    expect(sniffLogoType(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(
      'image/png',
    );
    expect(sniffLogoType(Uint8Array.of(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(sniffLogoType(text('GIF89a'))).toBe('image/gif');
    expect(sniffLogoType(text('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(sniffLogoType(Uint8Array.of(0, 0, 1, 0, 1, 0))).toBe('image/x-icon');
    expect(sniffLogoType(text('  <svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe(
      'image/svg+xml',
    );
    expect(sniffLogoType(text('<?xml version="1.0"?>\n<svg></svg>'))).toBe('image/svg+xml');
  });

  it('knows nothing else', () => {
    expect(sniffLogoType(text('<html><body>nope</body></html>'))).toBeNull();
    expect(sniffLogoType(text('<?xml version="1.0"?><rss/>'))).toBeNull();
    expect(sniffLogoType(new Uint8Array())).toBeNull();
  });
});
