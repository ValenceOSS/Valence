import {
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
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

/**
 * A file system error of the kind given.
 */
const failing = (code: string) => () =>
  Promise.reject(Object.assign(new Error(`${code}: it went wrong`), { code }));

describe('placeFile across disks', () => {
  it('copies a torrent’s file it cannot link, so the torrent can still seed', async () => {
    const { root, source } = await aDownload();
    const destination = join(root, 'Films', 'Dune.mkv');
    const files = { copyFile, link: failing('EXDEV'), mkdir, rename, stat, unlink };

    expect(await placeFile(source, destination, true, files)).toBe('copied');
    expect(await readFile(source, 'utf8')).toBe('film');
  });

  it('moves anything else it cannot link, copying where even a move cannot cross', async () => {
    const { root, source } = await aDownload();
    const destination = join(root, 'Films', 'Dune.mkv');

    expect(
      await placeFile(source, destination, false, {
        copyFile,
        link: failing('EXDEV'),
        mkdir,
        rename,
        stat,
        unlink,
      }),
    ).toBe('moved');

    const again = await aDownload();

    expect(
      await placeFile(again.source, join(again.root, 'Dune.mkv'), false, {
        copyFile,
        link: failing('EXDEV'),
        mkdir,
        rename: failing('EXDEV'),
        stat,
        unlink,
      }),
    ).toBe('moved');
    await expect(stat(again.source)).rejects.toThrow();
  });

  it('says what went wrong where it is not a matter of disks', async () => {
    const { root, source } = await aDownload();
    const files = { copyFile, link: failing('EIO'), mkdir, rename, stat, unlink };

    await expect(placeFile(source, join(root, 'x.mkv'), true, files)).rejects.toThrow('EIO');
    await expect(
      placeFile(source, join(root, 'y.mkv'), false, {
        ...files,
        link: failing('EXDEV'),
        rename: failing('EIO'),
      }),
    ).rejects.toThrow('EIO');
  });
});

describe('placeFile where it may not write', () => {
  it('says which user it runs as and what to set', async () => {
    const { root, source } = await aDownload();
    const files = { copyFile, link, mkdir: failing('EACCES'), rename, stat, unlink };

    await expect(
      placeFile(
        source,
        join(root, 'Films', 'Dune.mkv'),
        true,
        files,
        () => 'user 1000 and group 1000',
      ),
    ).rejects.toThrow(
      `The requests service, running as user 1000 and group 1000, may not write to ${join(root, 'Films')}. Set PUID and PGID on it to the owner of your media folders.`,
    );
  });

  it('names the user this process runs as, by default', async () => {
    const { root, source } = await aDownload();
    const files = { copyFile, link, mkdir: failing('EACCES'), rename, stat, unlink };

    await expect(placeFile(source, join(root, 'Films', 'Dune.mkv'), true, files)).rejects.toThrow(
      /running as (user \d+ and group \d+|this user)/u,
    );
  });
});
