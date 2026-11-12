import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readPicture } from './readPicture';

describe('readPicture', () => {
  it('reads the cleaned copy, never the upload it was made from', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-read-'));

    await mkdir(join(folder, 'originals'));
    await mkdir(join(folder, 'processed'));
    await writeFile(join(folder, 'originals', 'a.png'), 'original');
    await writeFile(join(folder, 'processed', 'a.webp'), 'cleaned');

    const read = await readPicture(folder, 'a.png');

    expect(read?.contentType).toBe('image/webp');
    expect(new TextDecoder().decode(read?.body)).toBe('cleaned');
  });

  it('has nothing to show where there is no cleaned copy', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-read-'));

    await writeFile(join(folder, 'a.png'), 'loose');

    await expect(readPicture(folder, 'a.png')).resolves.toBeNull();
  });
});
