import type { BookFormat } from '@ValenceContracts/schemas/MediaRequest';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const AUDIO_CATEGORIES = { from: 3000, to: 3999 };

const BOOK_CATEGORIES = { from: 7000, to: 7999 };

const HEARD = /\b(?:m4b|m4a|mp3|flac|aac|audiobooks?|audio ?book|unabridged|abridged|narrated)\b/i;

const READ = /\b(?:epub|azw3?|mobi|kfx|pdf|cbz|cbr|ebooks?|kindle)\b/i;

/**
 * Whether a release is a book to read or one to hear: by the categories its indexer filed it under
 * first, and otherwise by what its name says — an M4B, an MP3 or an audiobook is heard, an EPUB, an
 * AZW3 or a MOBI is read — and an ebook where nothing says, since that is what book categories
 * mostly hold.
 *
 * @param release - The release.
 * @returns Its format.
 */
const readBookFormat = (release: Pick<Release, 'title' | 'categories'>): BookFormat => {
  const isIn = (range: { from: number; to: number }) =>
    release.categories.some((category) => category >= range.from && category <= range.to);

  if (isIn(AUDIO_CATEGORIES)) {
    return 'audiobook';
  }

  if (isIn(BOOK_CATEGORIES)) {
    return 'ebook';
  }

  return HEARD.test(release.title) && !READ.test(release.title) ? 'audiobook' : 'ebook';
};

export { readBookFormat };
