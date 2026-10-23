import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deleteFiledPath } from './deleteFiledPath';

const aShelf = () => mkdtemp(join(tmpdir(), 'valence-delete-filed-'));

describe('deleteFiledPath', () => {
  it('deletes a film’s file', async () => {
    const film = join(await aShelf(), 'Film (2024).mkv');

    await writeFile(film, 'film');
    await deleteFiledPath(film);

    expect(existsSync(film)).toBe(false);
  });

  it('empties an album’s folder of what was filed into it, and removes the folder', async () => {
    const album = join(await aShelf(), 'Artist', 'Album');

    await mkdir(album, { recursive: true });
    await writeFile(join(album, '01 Track.flac'), 'a');
    await writeFile(join(album, '01 Track.lrc'), 'b');
    await writeFile(join(album, 'cover.jpg'), 'c');
    await deleteFiledPath(album);

    expect(existsSync(album)).toBe(false);
  });

  it('leaves the other books of a pack, each in its own folder under the one filed', async () => {
    const author = join(await aShelf(), 'Author');

    await mkdir(join(author, 'Another Book'), { recursive: true });
    await writeFile(join(author, 'Another Book', 'Another Book.epub'), 'kept');
    await deleteFiledPath(author);

    expect(await readdir(join(author, 'Another Book'))).toEqual(['Another Book.epub']);
  });

  it('keeps a folder holding something it did not put there', async () => {
    const album = join(await aShelf(), 'Album');

    await mkdir(album);
    await writeFile(join(album, '01 Track.mp3'), 'a');
    await writeFile(join(album, 'notes.txt'), 'mine');
    await deleteFiledPath(album);

    expect(await readdir(album)).toEqual(['notes.txt']);
  });
});
