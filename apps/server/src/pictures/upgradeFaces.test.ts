import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { upgradeFaces } from './upgradeFaces';

const aPhoto = () =>
  sharp({ create: { width: 1500, height: 1500, channels: 3, background: '#3a8ee8' } })
    .jpeg()
    .toBuffer();

const aFolder = () => mkdtemp(join(tmpdir(), 'valence-faces-'));

describe('upgradeFaces', () => {
  it('moves a loose upload among the originals and makes its processed picture', async () => {
    const directory = await aFolder();
    const photo = await aPhoto();

    await writeFile(join(directory, 'p1.jpg'), photo);

    await expect(
      upgradeFaces(directory, [{ name: 'p1.jpg', frame: null }], vi.fn()),
    ).resolves.toEqual({
      moved: 1,
      processed: 1,
    });
    expect(await readdir(directory)).toEqual(expect.not.arrayContaining(['p1.jpg']));
    expect(await readFile(join(directory, 'originals', 'p1.jpg'))).toEqual(photo);
    expect((await sharp(join(directory, 'processed', 'p1.webp')).metadata()).width).toBe(1024);
    expect((await sharp(join(directory, 'processed', 'p1.framed.webp')).metadata()).width).toBe(
      512,
    );
  });

  it('frames a face as it was framed before it was processed', async () => {
    const directory = await aFolder();

    await writeFile(join(directory, 'p1.jpg'), await aPhoto());
    await upgradeFaces(directory, [{ name: 'p1.jpg', frame: { zoom: 4, x: 0, y: 0 } }], vi.fn());

    expect((await sharp(join(directory, 'processed', 'p1.framed.webp')).metadata()).width).toBe(
      375,
    );
  });

  it('makes the framed picture of a face processed before framed pictures were kept', async () => {
    const directory = await aFolder();

    await mkdir(join(directory, 'originals'));
    await mkdir(join(directory, 'processed'));
    await writeFile(join(directory, 'originals', 'p1.jpg'), await aPhoto());
    await writeFile(join(directory, 'processed', 'p1.webp'), 'whole');

    await expect(
      upgradeFaces(directory, [{ name: 'p1.jpg', frame: null }], vi.fn()),
    ).resolves.toEqual({ moved: 0, processed: 1 });
    expect(await readdir(join(directory, 'processed'))).toContain('p1.framed.webp');
  });

  it('leaves alone what it is not told about, such as the picture behind the way in', async () => {
    const directory = await aFolder();

    await writeFile(join(directory, 'splashscreen.png'), await aPhoto());
    await upgradeFaces(directory, [], vi.fn());

    expect(await readdir(directory)).toEqual(['splashscreen.png']);
  });

  it('does nothing a second time', async () => {
    const directory = await aFolder();

    await writeFile(join(directory, 'p1.jpg'), await aPhoto());
    await upgradeFaces(directory, [{ name: 'p1.jpg', frame: null }], vi.fn());

    await expect(
      upgradeFaces(directory, [{ name: 'p1.jpg', frame: null }], vi.fn()),
    ).resolves.toEqual({
      moved: 0,
      processed: 0,
    });
  });

  it('moves a moving face without processing it', async () => {
    const directory = await aFolder();

    await writeFile(join(directory, 'p1.mp4'), 'moving');

    await expect(
      upgradeFaces(directory, [{ name: 'p1.mp4', frame: null }], vi.fn()),
    ).resolves.toEqual({
      moved: 1,
      processed: 0,
    });
  });

  it('tells of a picture it cannot process, moves on, and tries again next time', async () => {
    const directory = await aFolder();
    const onProblem = vi.fn();

    await mkdir(join(directory, 'originals'));
    await writeFile(join(directory, 'bad.png'), 'not a picture');
    await writeFile(join(directory, 'p2.jpg'), await aPhoto());

    await expect(
      upgradeFaces(
        directory,
        [
          { name: 'bad.png', frame: null },
          { name: 'p2.jpg', frame: null },
        ],
        onProblem,
      ),
    ).resolves.toEqual({
      moved: 2,
      processed: 1,
    });
    expect(onProblem).toHaveBeenCalledWith('bad.png', expect.any(Error));
  });

  it('passes over a face whose file is gone', async () => {
    const directory = await aFolder();

    await expect(
      upgradeFaces(directory, [{ name: 'gone.png', frame: null }], vi.fn()),
    ).resolves.toEqual({
      moved: 0,
      processed: 0,
    });
  });
});
