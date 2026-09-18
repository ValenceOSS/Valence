import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { MusicArtwork } from './scanMusicLibrary';

const EDGE = 1000;

const WEBP_QUALITY = 86;

/**
 * Keeps the pictures a music library is drawn with: an album's cover and an artist's photograph,
 * each drawn once to a size every screen can use and kept as WebP beside the rest of the artwork.
 *
 * A cover inside a FLAC is often a few megabytes of print-resolution scan. Nothing draws one wider
 * than a thousand pixels, so that is what is kept, and the file is read from the cache from then
 * on rather than out of the track again.
 *
 * @param directory - Where the pictures are kept.
 * @returns A way to keep one, which answers where it was kept, or nothing where it would not draw.
 */
const createMusicArtwork = (directory: string): MusicArtwork => ({
  keep: async (kind, id, source) => {
    const bytes =
      'picture' in source ? source.picture.bytes : await readFile(source.path).catch(() => null);

    if (bytes === null) {
      return null;
    }

    const at = join(directory, `${kind}-${id}.webp`);

    await mkdir(directory, { recursive: true }).catch(() => null);

    const drawn = await sharp(bytes)
      .rotate()
      .resize({ width: EDGE, height: EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(at)
      .catch(() => null);

    return drawn === null ? null : at;
  },
});

export { createMusicArtwork };
