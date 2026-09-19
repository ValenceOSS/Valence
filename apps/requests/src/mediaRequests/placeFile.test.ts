import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { placeFile } from './placeFile';

/**
 * A folder of its own for one test, with a downloaded file in it.
 */
const aDownload = async () => {
  const root = await mkdtemp(join(tmpdir(), 'valence-place-'));
  const source = join(root, 'downloads', 'Dune.2021.1080p.mkv');

  await mkdir(join(root, 'downloads'));
  await writeFile(source, 'film');

  return { root, source };
};

describe('placeFile', () => {
  it('links a file into a folder it makes, so the two are one file', async () => {
    const { root, source } = await aDownload();
    const destination = join(root, 'Films', 'Dune (2021)', 'Dune (2021).mkv');

    expect(await placeFile(source, destination, true)).toBe('linked');
    expect((await stat(destination)).ino).toBe((await stat(source)).ino);
    expect(await placeFile(source, destination, true)).toBe('already');
  });

  it('replaces what was there before, as an upgrade does', async () => {
    const { root, source } = await aDownload();
    const destination = join(root, 'Films', 'Dune (2021).mkv');

    await writeFile(join(root, 'old.mkv'), 'worse');
    await placeFile(join(root, 'old.mkv'), destination, false);
    await placeFile(source, destination, false);

    expect(await readFile(destination, 'utf8')).toBe('film');
  });

  it('says what went wrong where there is nothing to place', async () => {
    const { root } = await aDownload();

    await expect(placeFile(join(root, 'nothing.mkv'), join(root, 'x.mkv'), true)).rejects.toThrow();
  });
});
