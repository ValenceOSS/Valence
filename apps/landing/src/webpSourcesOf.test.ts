import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { webpSourcesOf } from './webpSourcesOf';

const PUBLIC = join(import.meta.dirname, '..', 'public');

const DRAWN: readonly { folder: string; pattern: RegExp; widths: readonly number[] }[] = [
  { folder: 'tour', pattern: /\.jpg$/u, widths: [800, 1600, 2400] },
  { folder: 'devices', pattern: /^web\.jpg$/u, widths: [800, 1600, 2400] },
  { folder: 'devices', pattern: /^iphone-.+\.png$/u, widths: [224, 448] },
  { folder: 'phones', pattern: /\.jpg$/u, widths: [276, 552] },
];

describe('webpSourcesOf', () => {
  it('names the WebP copy at each width, beside the original', () => {
    expect(webpSourcesOf('/tour/home.jpg', [800, 1600])).toBe(
      '/tour/home-800.webp 800w, /tour/home-1600.webp 1600w',
    );
    expect(webpSourcesOf('/devices/iphone-blue.png', [224])).toBe(
      '/devices/iphone-blue-224.webp 224w',
    );
  });

  it('names none for a picture that has no WebP copies, so the original is used', () => {
    expect(webpSourcesOf('/hero-3.jpeg', [800])).toBe('');
  });

  it('finds every copy it names for the pictures the site draws', () => {
    const named = DRAWN.flatMap(({ folder, pattern, widths }) =>
      readdirSync(join(PUBLIC, folder))
        .filter((file) => pattern.test(file))
        .flatMap((file) =>
          webpSourcesOf(`/${folder}/${file}`, widths)
            .split(', ')
            .map((source) => source.split(' ')[0] ?? ''),
        ),
    );

    expect(named.length).toBeGreaterThan(20);
    expect(named.filter((source) => !existsSync(join(PUBLIC, source)))).toEqual([]);
  });
});
