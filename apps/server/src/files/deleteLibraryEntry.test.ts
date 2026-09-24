import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { deleteLibraryEntry } from './deleteLibraryEntry';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-files-'));
  await mkdir(join(root, 'Show', 'Season 1'), { recursive: true });
  await writeFile(join(root, 'Show', 'Season 1', 'S01E01.mkv'), 'x');
  await writeFile(join(root, 'Arrival.mkv'), 'x');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('deleteLibraryEntry', () => {
  it('deletes a file, and says which library changed', async () => {
    const library = aLibraryAt(root);

    await expect(deleteLibraryEntry([library], join(root, 'Arrival.mkv'))).resolves.toEqual({
      kind: 'changed',
      path: join(root, 'Arrival.mkv'),
      libraryIds: [library.id],
    });
    expect(await readdir(root)).toEqual(['Show']);
  });

  it('deletes a folder with everything in it', async () => {
    await deleteLibraryEntry([aLibraryAt(root)], join(root, 'Show'));

    expect(await readdir(root)).toEqual(['Arrival.mkv']);
  });

  it('never deletes the library itself, nor anything outside one', async () => {
    await expect(deleteLibraryEntry([aLibraryAt(root)], root)).resolves.toEqual({ kind: 'root' });
    await expect(
      deleteLibraryEntry([aLibraryAt(join(root, 'Show'))], join(root, 'Arrival.mkv')),
    ).resolves.toEqual({ kind: 'outside' });
    expect((await readdir(root)).sort()).toEqual(['Arrival.mkv', 'Show']);
  });

  it('says so where there is nothing to delete', async () => {
    await expect(deleteLibraryEntry([aLibraryAt(root)], join(root, 'Gone.mkv'))).resolves.toEqual({
      kind: 'missing',
    });
  });
});
