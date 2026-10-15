import { describe, expect, it } from 'vitest';
import { booksInDownload } from './booksInDownload';
import type { SoundTags } from './readSoundTags';

const fileAt = (path: string) => ({ path, name: path.split('/').at(-1) ?? '', sizeBytes: 0 });

const untagged = () => Promise.resolve(null);

/**
 * Reads each track's album from a table of them, by its name.
 *
 * @param albums - Each track's album, by its name.
 * @returns The reader.
 */
const taggedBy =
  (albums: Record<string, string>) =>
  (path: string): Promise<SoundTags | null> =>
    Promise.resolve({
      album: albums[path.split('/').at(-1) ?? ''] ?? null,
      title: null,
      author: 'An Author',
    });

describe('booksInDownload', () => {
  it('takes a download’s tracks and text as one book, with its tracks in order', async () => {
    const [book, ...others] = await booksInDownload(
      [fileAt('/dl/Book/Part 10.mp3'), fileAt('/dl/Book/Part 2.mp3'), fileAt('/dl/Book/Book.epub')],
      untagged,
    );

    expect(others).toEqual([]);
    expect(book?.tracks.map((track) => track.name)).toEqual(['Part 2.mp3', 'Part 10.mp3']);
    expect(book?.texts.map((text) => text.name)).toEqual(['Book.epub']);
  });

  it('tells a pack’s books apart by the albums their tracks are tagged with', async () => {
    const books = await booksInDownload(
      [fileAt('/dl/01 - First.m4b'), fileAt('/dl/02 - Second.m4b')],
      taggedBy({ '01 - First.m4b': 'First', '02 - Second.m4b': 'Second' }),
    );

    expect(books.map((book) => book.title)).toEqual(['First', 'Second']);
  });

  it('tells untagged books apart by their folders, keeping each book’s text with it', async () => {
    const books = await booksInDownload(
      [
        fileAt('/dl/1 - First/01.mp3'),
        fileAt('/dl/1 - First/CD 2/01.mp3'),
        fileAt('/dl/1 - First/First.epub'),
        fileAt('/dl/2 - Second/01.mp3'),
      ],
      untagged,
    );

    expect(
      books.map((book) => ({ title: book.title, tracks: book.tracks.length, texts: book.texts })),
    ).toEqual([
      { title: 'First', tracks: 2, texts: [fileAt('/dl/1 - First/First.epub')] },
      { title: 'Second', tracks: 1, texts: [] },
    ]);
  });

  it('finds no book in a download with nothing to read or hear', async () => {
    expect(await booksInDownload([fileAt('/dl/notes.nfo')], untagged)).toEqual([]);
  });
});
