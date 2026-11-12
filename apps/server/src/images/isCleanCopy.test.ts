import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { isCleanCopy } from './isCleanCopy';

const keep = async (folder: string, name: string, body: Buffer, type: string) => {
  await writeFile(join(folder, name), body);
  await writeFile(join(folder, `${name}.type`), type);

  return join(folder, name);
};

const aPicture = () =>
  sharp({ create: { width: 4, height: 4, channels: 3, background: '#3a8ee8' } });

describe('isCleanCopy', () => {
  it('passes a WebP that carries nothing about where it came from', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-copies-'));

    await expect(
      isCleanCopy(await keep(folder, 'a', await aPicture().webp().toBuffer(), 'image/webp')),
    ).resolves.toBe(true);
  });

  it('fails a copy kept as it came, or a WebP still carrying what the camera wrote', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-copies-'));
    const tagged = await aPicture()
      .withExif({ IFD0: { Make: 'A camera' } })
      .webp()
      .toBuffer();

    await expect(
      isCleanCopy(await keep(folder, 'a', await aPicture().jpeg().toBuffer(), 'image/jpeg')),
    ).resolves.toBe(false);
    await expect(isCleanCopy(await keep(folder, 'b', tagged, 'image/webp'))).resolves.toBe(false);
  });

  it('has nothing to say where there is no copy', async () => {
    await expect(
      isCleanCopy(join(await mkdtemp(join(tmpdir(), 'valence-copies-')), 'a')),
    ).resolves.toBeNull();
  });
});
