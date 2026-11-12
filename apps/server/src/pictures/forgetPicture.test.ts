import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { forgetPicture } from './forgetPicture';

describe('forgetPicture', () => {
  it('removes the original, its cleaned copy and a loose upload, and nothing else', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-forget-'));

    await mkdir(join(folder, 'originals'));
    await mkdir(join(folder, 'processed'));
    await writeFile(join(folder, 'a.png'), 'loose');
    await writeFile(join(folder, 'originals', 'a.png'), 'original');
    await writeFile(join(folder, 'processed', 'a.webp'), 'cleaned');
    await writeFile(join(folder, 'originals', 'b.png'), 'another');

    await forgetPicture(folder, 'a.png');

    expect(await readdir(folder)).toEqual(['originals', 'processed']);
    expect(await readdir(join(folder, 'originals'))).toEqual(['b.png']);
    expect(await readdir(join(folder, 'processed'))).toEqual([]);
  });

  it('minds nothing where the picture is already gone', async () => {
    await expect(
      forgetPicture(await mkdtemp(join(tmpdir(), 'valence-forget-')), 'a.png'),
    ).resolves.toBeUndefined();
  });
});
