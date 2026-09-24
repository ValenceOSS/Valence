import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteMediaFile } from './deleteMediaFile';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-delete-'));
});

afterEach(async () => {
  await chmod(root, 0o755).catch(() => undefined);
  await rm(root, { recursive: true, force: true });
});

/**
 * Makes a file, and the folders it sits in.
 *
 * @param path - Where, inside the library.
 */
const place = async (path: string) => {
  const at = join(root, path);

  await mkdir(join(at, '..'), { recursive: true });
  await writeFile(at, 'x');
};

describe('deleteMediaFile', () => {
  it('deletes the file with what was kept beside it for it, and leaves another film be', async () => {
    await place('Arrival (2016)/Arrival (2016).mkv');
    await place('Arrival (2016)/Arrival (2016).en.srt');
    await place('Arrival (2016)/Arrival (2016).nfo');
    await place('Arrival (2016)/Arrival (2016)-poster.jpg');
    await place('Arrival (2016)/Arrival (2016).Extended.mkv');
    await place('Arrival (2016)/notes.txt');

    await expect(
      deleteMediaFile(root, join(root, 'Arrival (2016)/Arrival (2016).mkv')),
    ).resolves.toEqual({ kind: 'deleted' });
    expect((await readdir(join(root, 'Arrival (2016)'))).sort()).toEqual([
      'Arrival (2016).Extended.mkv',
      'notes.txt',
    ]);
  });

  it('takes away the folders it leaves empty, and never the library itself', async () => {
    await place('Show/Season 1/S01E01.mkv');
    await place('Show/poster.jpg');

    await deleteMediaFile(root, join(root, 'Show/Season 1/S01E01.mkv'));

    expect(await readdir(join(root, 'Show'))).toEqual(['poster.jpg']);

    await place('Film.mkv');
    await deleteMediaFile(root, join(root, 'Film.mkv'));

    expect(await readdir(root)).toEqual(['Show']);
  });

  it('counts a file already gone as deleted', async () => {
    await expect(deleteMediaFile(root, join(root, 'Gone.mkv'))).resolves.toEqual({
      kind: 'deleted',
    });
  });

  it('refuses a path outside the library, or the library itself, before touching anything', async () => {
    const elsewhere = await mkdtemp(join(tmpdir(), 'valence-elsewhere-'));

    await writeFile(join(elsewhere, 'Film.mkv'), 'x');

    await expect(deleteMediaFile(root, join(elsewhere, 'Film.mkv'))).resolves.toEqual({
      kind: 'outside',
    });
    await expect(deleteMediaFile(root, `${root}-other/Film.mkv`)).resolves.toEqual({
      kind: 'outside',
    });
    await expect(deleteMediaFile(root, root)).resolves.toEqual({ kind: 'outside' });
    expect(await readdir(elsewhere)).toEqual(['Film.mkv']);

    await rm(elsewhere, { recursive: true, force: true });
  });

  it.skipIf(process.getuid?.() === 0)('says so where it is not allowed to delete', async () => {
    await place('Locked/Film.mkv');
    await chmod(join(root, 'Locked'), 0o555);

    await expect(deleteMediaFile(root, join(root, 'Locked/Film.mkv'))).resolves.toEqual({
      kind: 'denied',
    });

    await chmod(join(root, 'Locked'), 0o755);
  });
});
