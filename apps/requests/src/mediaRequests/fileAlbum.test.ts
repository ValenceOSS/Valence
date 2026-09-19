import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileAlbum } from './fileAlbum';
import type { AudioTags } from './AudioTags';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-album-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const NO_TAGS: AudioTags = {
  artist: null,
  album: null,
  year: null,
  disc: null,
  track: null,
  title: null,
};

const REQUEST = { libraryPath: '', title: 'Pink Floyd', artistName: 'Pink Floyd' };

/**
 * Writes files into a download's folder, returning where it is.
 */
const aDownload = async (names: readonly string[]): Promise<string> => {
  const folder = join(root, 'downloads', 'Pink Floyd - The Wall (2011 Remaster) [FLAC]');

  for (const name of names) {
    await mkdir(join(folder, name, '..'), { recursive: true });
    await writeFile(join(folder, name), name);
  }

  return folder;
};

/**
 * Every file under a folder, relative to it, sorted.
 */
const filesUnder = async (folder: string): Promise<string[]> =>
  (await readdir(folder, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1))
    .toSorted();

describe('fileAlbum', () => {
  it('files an album by its tags into its artist’s folder, by disc and track', async () => {
    const download = await aDownload(['CD1/01.flac', 'CD2/03.flac', 'cover.jpg', 'rip.log']);
    const tags: Record<string, AudioTags> = {
      '01.flac': {
        artist: 'Pink Floyd',
        album: 'The Wall',
        year: 1979,
        disc: 1,
        track: 1,
        title: 'In the Flesh?',
      },
      '03.flac': {
        artist: 'Pink Floyd',
        album: 'The Wall',
        year: 1979,
        disc: 2,
        track: 3,
        title: 'Comfortably Numb',
      },
    };
    const library = join(root, 'Music');

    const outcome = await fileAlbum(
      { ...REQUEST, libraryPath: library },
      [{ id: 'wall', title: 'The Wall', airDate: '1979-11-30', filePath: null }],
      download,
      true,
      (path) => Promise.resolve(tags[path.slice(path.lastIndexOf('/') + 1)] ?? NO_TAGS),
    );

    expect(outcome).toEqual({
      filed: new Map([['wall', join(library, 'Pink Floyd', 'The Wall (1979)')]]),
      missing: [],
    });
    expect(await filesUnder(library)).toEqual([
      'Pink Floyd/The Wall (1979)/1-01 - In the Flesh.flac',
      'Pink Floyd/The Wall (1979)/2-03 - Comfortably Numb.flac',
      'Pink Floyd/The Wall (1979)/cover.jpg',
    ]);
    expect(await filesUnder(download)).toHaveLength(4);
  });

  it('names untagged tracks from their files, and the album from the request', async () => {
    const download = await aDownload(['02 - Mother.mp3', '01 - Hey You.mp3']);
    const library = join(root, 'Music');

    await fileAlbum(
      { ...REQUEST, libraryPath: library },
      [{ id: 'wall', title: 'The Wall', airDate: '1979-11-30', filePath: null }],
      download,
      false,
      () => Promise.resolve(NO_TAGS),
    );

    expect(await filesUnder(library)).toEqual([
      'Pink Floyd/The Wall (1979)/01 - Hey You.mp3',
      'Pink Floyd/The Wall (1979)/02 - Mother.mp3',
    ]);
  });

  it('files only the tracks of each album asked for, and says which it could not find', async () => {
    const download = await aDownload(['a.flac', 'b.flac']);
    const library = join(root, 'Music');
    const album = (title: string): AudioTags => ({
      ...NO_TAGS,
      artist: 'Pink Floyd',
      album: title,
    });

    const outcome = await fileAlbum(
      { ...REQUEST, libraryPath: library },
      [
        { id: 'wall', title: 'The Wall', airDate: null, filePath: null },
        { id: 'animals', title: 'Animals', airDate: null, filePath: null },
      ],
      download,
      true,
      (path) => Promise.resolve(album(path.endsWith('a.flac') ? 'The Wall' : 'Meddle')),
    );

    expect(outcome.missing).toEqual(['animals']);
    expect(await filesUnder(library)).toEqual(['Pink Floyd/The Wall/01 - a.flac']);
  });

  it('removes the tracks of the album it replaces that it did not bring', async () => {
    const library = join(root, 'Music');
    const before = join(library, 'Pink Floyd', 'The Wall (1979)');

    await mkdir(before, { recursive: true });
    await writeFile(join(before, '01 - In the Flesh.mp3'), 'old');
    await writeFile(join(before, 'notes.txt'), 'kept');

    const download = await aDownload(['01.flac']);

    await fileAlbum(
      { ...REQUEST, libraryPath: library },
      [{ id: 'wall', title: 'The Wall', airDate: '1979-11-30', filePath: before }],
      download,
      true,
      () =>
        Promise.resolve({
          ...NO_TAGS,
          album: 'The Wall',
          track: 1,
          title: 'In the Flesh?',
          year: 1979,
        }),
    );

    expect(await filesUnder(before)).toEqual(['01 - In the Flesh.flac', 'notes.txt']);
  });
});
