import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { listLibraryFolder } from './listLibraryFolder';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-files-'));
  await mkdir(join(root, 'Season 10'));
  await mkdir(join(root, 'Season 2'));
  await mkdir(join(root, '.hidden'));
  await writeFile(join(root, 'Arrival.mkv'), 'a film');
  await writeFile(join(root, 'notes.txt'), 'x');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const nothingKnown = () => Promise.resolve({});

describe('listLibraryFolder', () => {
  it('lists the libraries, asked about nothing', async () => {
    const answer = await listLibraryFolder([aLibraryAt(root)], undefined, nothingKnown);

    expect(answer.kind === 'listed' ? answer.folder.entries : []).toEqual([
      expect.objectContaining({ name: 'Films', path: root, isFolder: true }),
    ]);
  });

  it('lists folders then files, as a person sorts them, with sizes and what Valence knows', async () => {
    const library = aLibraryAt(root);
    const answer = await listLibraryFolder([library], root, (paths) =>
      Promise.resolve(
        Object.fromEntries(
          paths.filter((path) => path.endsWith('.mkv')).map((path) => [path, 'media-1']),
        ),
      ),
    );

    expect(answer.kind).toBe('listed');

    const folder = answer.kind === 'listed' ? answer.folder : null;

    expect(folder?.entries.map((entry) => entry.name)).toEqual([
      'Season 2',
      'Season 10',
      'Arrival.mkv',
      'notes.txt',
    ]);
    expect(folder?.entries[2]).toMatchObject({ sizeBytes: 6, mediaId: 'media-1' });
    expect(folder?.entries[3]).toMatchObject({ mediaId: null });
    expect(folder).toMatchObject({ parent: null, libraryId: library.id, libraryPath: root });
  });

  it('gives a folder inside a library the one above it', async () => {
    const answer = await listLibraryFolder(
      [aLibraryAt(root)],
      join(root, 'Season 2'),
      nothingKnown,
    );

    expect(answer.kind === 'listed' ? answer.folder.parent : 'not listed').toBe(root);
  });

  it('refuses anything outside a library, and says a folder is not there', async () => {
    await expect(
      listLibraryFolder([aLibraryAt(join(root, 'Season 2'))], root, nothingKnown),
    ).resolves.toEqual({
      kind: 'outside',
    });
    await expect(
      listLibraryFolder([aLibraryAt(root)], join(root, 'nowhere'), nothingKnown),
    ).resolves.toEqual({ kind: 'missing' });
  });
});
