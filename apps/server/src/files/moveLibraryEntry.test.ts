import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { moveLibraryEntry } from './moveLibraryEntry';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-files-'));
  await mkdir(join(root, 'films', 'Arrival (2016)'), { recursive: true });
  await mkdir(join(root, 'anime'), { recursive: true });
  await writeFile(join(root, 'films', 'Arrival.mkv'), 'x');
  await writeFile(join(root, 'films', 'Dune.mkv'), 'x');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const FILMS = () => aLibraryAt(join(root, 'films'), 'films');
const ANIME = () => aLibraryAt(join(root, 'anime'), 'anime');

describe('moveLibraryEntry', () => {
  it('moves a file into a folder, keeping its name', async () => {
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films', 'Arrival.mkv'), {
        into: join(root, 'films', 'Arrival (2016)'),
      }),
    ).resolves.toEqual({
      kind: 'changed',
      path: join(root, 'films', 'Arrival (2016)', 'Arrival.mkv'),
      libraryIds: ['films'],
    });
  });

  it('moves between libraries, and says both changed', async () => {
    const moved = await moveLibraryEntry([FILMS(), ANIME()], join(root, 'films', 'Dune.mkv'), {
      into: join(root, 'anime'),
    });

    expect(moved).toMatchObject({ kind: 'changed', libraryIds: ['films', 'anime'] });
    expect(await readdir(join(root, 'anime'))).toEqual(['Dune.mkv']);
  });

  it('renames where it is', async () => {
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films', 'Arrival.mkv'), {
        name: 'Arrival (2016).mkv',
      }),
    ).resolves.toMatchObject({ kind: 'changed', path: join(root, 'films', 'Arrival (2016).mkv') });
  });

  it('refuses a name that is a path, or blank, or dots', async () => {
    for (const name of ['../x.mkv', 'a/b.mkv', ' ', '..', ' padded ']) {
      await expect(
        moveLibraryEntry([FILMS()], join(root, 'films', 'Arrival.mkv'), { name }),
      ).resolves.toEqual({ kind: 'badName' });
    }
  });

  it('never replaces what is already there', async () => {
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films', 'Arrival.mkv'), { name: 'Dune.mkv' }),
    ).resolves.toEqual({ kind: 'exists' });
  });

  it('never moves a folder into itself, nor the library, nor outside a library', async () => {
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films', 'Arrival (2016)'), {
        into: join(root, 'films', 'Arrival (2016)'),
      }),
    ).resolves.toEqual({ kind: 'intoItself' });
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films'), { into: join(root, 'anime') }),
    ).resolves.toEqual({ kind: 'root' });
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films', 'Dune.mkv'), { into: join(root, 'anime') }),
    ).resolves.toEqual({ kind: 'outside' });
  });

  it('says so where the folder to move into is not there', async () => {
    await expect(
      moveLibraryEntry([FILMS()], join(root, 'films', 'Dune.mkv'), {
        into: join(root, 'films', 'nowhere'),
      }),
    ).resolves.toEqual({ kind: 'missing' });
  });
});
