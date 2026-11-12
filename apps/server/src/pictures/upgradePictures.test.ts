import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { upgradePictures } from './upgradePictures';

const aPhoto = () =>
  sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#3a8ee8' } })
    .withExif({ IFD0: { Make: 'A camera' } })
    .jpeg()
    .toBuffer();

const aFolder = () => mkdtemp(join(tmpdir(), 'valence-pictures-'));

describe('upgradePictures', () => {
  it('moves a loose upload among the originals and makes its cleaned copy at its own size', async () => {
    const folder = await aFolder();
    const photo = await aPhoto();

    await writeFile(join(folder, 'a.jpg'), photo);

    await expect(upgradePictures(folder, ['a.jpg'], vi.fn())).resolves.toEqual({
      moved: 1,
      processed: 1,
    });
    expect(await readdir(folder)).toEqual(['originals', 'processed']);
    expect(await readFile(join(folder, 'originals', 'a.jpg'))).toEqual(photo);

    const cleaned = await sharp(join(folder, 'processed', 'a.webp')).metadata();

    expect(cleaned).toMatchObject({ format: 'webp', width: 2000 });
    expect(cleaned.exif).toBeUndefined();
  });

  it('leaves a picture already brought up to date, so it can run at every start', async () => {
    const folder = await aFolder();

    await writeFile(join(folder, 'a.jpg'), await aPhoto());
    await upgradePictures(folder, ['a.jpg'], vi.fn());

    await expect(upgradePictures(folder, ['a.jpg', 'a.jpg'], vi.fn())).resolves.toEqual({
      moved: 0,
      processed: 0,
    });
  });

  it('makes the cleaned copy of an original that has none', async () => {
    const folder = await aFolder();

    await mkdir(join(folder, 'originals'));
    await writeFile(join(folder, 'originals', 'a.jpg'), await aPhoto());

    await expect(upgradePictures(folder, ['a.jpg'], vi.fn())).resolves.toEqual({
      moved: 0,
      processed: 1,
    });
  });

  it('tells of a picture it cannot clean, keeps its original, and carries on with the rest', async () => {
    const folder = await aFolder();
    const onProblem = vi.fn();

    await writeFile(join(folder, 'broken.jpg'), 'not a picture');
    await writeFile(join(folder, 'b.jpg'), await aPhoto());

    await expect(
      upgradePictures(folder, ['broken.jpg', 'b.jpg', 'gone.jpg'], onProblem),
    ).resolves.toEqual({
      moved: 2,
      processed: 1,
    });
    expect(onProblem).toHaveBeenCalledExactlyOnceWith('broken.jpg', expect.any(Error));
    await expect(readFile(join(folder, 'originals', 'broken.jpg'), 'utf8')).resolves.toBe(
      'not a picture',
    );
  });
});
