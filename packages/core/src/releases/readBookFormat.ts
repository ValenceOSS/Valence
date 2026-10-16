import type { BookFormat } from '@ValenceContracts/schemas/MediaRequest';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const AUDIO_CATEGORIES = { from: 3000, to: 3999 };

const EBOOK_CATEGORY = 7020;

const HEARD =
  /\b(?:m4b|m4a|mp3|flac|aac|audiobooks?|audio ?book|audio|unabridged|abridged|narrated)\b/i;

const HEARD_FROM_BYTES = 100 * 1024 * 1024;

const READ = /\b(?:epub|azw3?|mobi|kfx|pdf|cbz|cbr|ebooks?|kindle)\b/i;

/**
 * Whether a release is a book to read or one to hear: by the category its indexer filed it under
 * where that says which — an audio category is heard, Books/EBook is read — and otherwise by what
 * its name says — an M4B, an MP3 or an audiobook is heard, an EPUB, an AZW3 or a MOBI is read —
 * then by its size, as an ebook is a few megabytes and an audiobook hundreds — and an ebook where
 * nothing says, since that is what book categories mostly hold. Books on its own says neither, as
 * many indexers file audiobooks there.
 *
 * @param release - The release.
 * @returns Its format.
 */
const readBookFormat = (
  release: Pick<Release, 'title' | 'categories'> & Partial<Pick<Release, 'sizeBytes'>>,
): BookFormat => {
  const isIn = (range: { from: number; to: number }) =>
    release.categories.some((category) => category >= range.from && category <= range.to);

  if (isIn(AUDIO_CATEGORIES)) {
    return 'audiobook';
  }

  if (release.categories.includes(EBOOK_CATEGORY)) {
    return 'ebook';
  }

  const isHeard = HEARD.test(release.title);
  const isRead = READ.test(release.title);

  return isHeard !== isRead
    ? isHeard
      ? 'audiobook'
      : 'ebook'
    : !isRead && (release.sizeBytes ?? 0) >= HEARD_FROM_BYTES
      ? 'audiobook'
      : 'ebook';
};

export { readBookFormat };
