import { BOOKMARK_EXCERPT_MOST, BOOKMARK_PICTURE_MOST } from '@ValenceContracts/schemas/Book';
import { readBookDocument } from '@ValenceCore/books/readBookDocument';
import { typesetBlocksOf } from '@ValenceCore/books/typesetBlocksOf';
import type { TypesetBlock } from '@ValenceContracts/schemas/BookText';

const PICTURE_WEIGHT = 600;

const EXCERPT_LENGTH = 120;

const HREF = /[?&]href=([^&#]*)/;

const HEADINGS: ReadonlySet<TypesetBlock['kind']> = new Set(['title', 'heading', 'subheading']);

type BookmarkPreview = { excerpt: string | null; picture: string | null };

/**
 * The words of a block, as one run of plain text.
 *
 * @param block - The block.
 * @returns Its words, with their spacing tidied.
 */
const wordsOf = (block: TypesetBlock): string =>
  block.runs
    .map((run) => run.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The address inside the book a picture was drawn from, read back out of the address the server gave
 * it.
 *
 * @param address - The picture's address.
 * @returns Where it is in the book, or nothing where it cannot be told.
 */
const hrefOf = (address: string): string | null => {
  const found = HREF.exec(address)?.[1];

  if (found === undefined) {
    return null;
  }

  try {
    const href = decodeURIComponent(found);

    return href.length > 0 && href.length <= BOOKMARK_PICTURE_MOST ? href : null;
  } catch {
    return null;
  }
};

/**
 * Cuts some words down to a short excerpt, at a space rather than through a word.
 *
 * @param words - The words.
 * @returns The excerpt, ending in an ellipsis where it was cut.
 */
const shortened = (words: string): string => {
  if (words.length <= EXCERPT_LENGTH) {
    return words;
  }

  const cut = words.slice(0, EXCERPT_LENGTH);
  const space = cut.lastIndexOf(' ');

  return `${(space > EXCERPT_LENGTH / 2 ? cut.slice(0, space) : cut).trimEnd()}…`.slice(
    0,
    BOOKMARK_EXCERPT_MOST,
  );
};

/**
 * What a bookmark at a place in a part of a book shows in a list of bookmarks: the words that start
 * there, or the picture there where the place falls on one, as in a book made of pictures. A picture
 * counts for about a page of words when finding the place, since it fills a page. Headings are left
 * out where there is prose after them, since the list names the chapter already.
 *
 * @param part - The part, as its document or as the blocks it is typeset in.
 * @param within - How far into the part, from 0 to 1.
 * @returns The excerpt or the picture, or neither where the part holds nothing to show.
 */
const bookmarkPreviewOf = (
  part: string | readonly TypesetBlock[],
  within: number,
): BookmarkPreview => {
  const blocks = typeof part === 'string' ? typesetBlocksOf(readBookDocument(part)) : part;
  const weighed = blocks.map((block) => {
    const words = wordsOf(block);

    return {
      block,
      words,
      weight: block.kind === 'picture' ? PICTURE_WEIGHT : words.length,
    };
  });
  const total = weighed.reduce((sum, one) => sum + one.weight, 0);

  if (total === 0) {
    return { excerpt: null, picture: null };
  }

  const wanted = Math.min(Math.max(within, 0), 1) * total;
  let before = 0;
  let at = -1;

  for (const [index, one] of weighed.entries()) {
    if (one.weight > 0 && wanted < before + one.weight) {
      at = index;

      break;
    }

    before += one.weight;
  }

  if (at === -1) {
    at = weighed.findLastIndex((one) => one.weight > 0);
    before = total - (weighed[at]?.weight ?? 0);
  }

  const found = weighed[at];

  if (found === undefined) {
    return { excerpt: null, picture: null };
  }

  if (found.block.kind === 'picture') {
    return {
      excerpt: null,
      picture: found.block.picture === undefined ? null : hrefOf(found.block.picture.address),
    };
  }

  const offset = Math.floor(wanted - before);
  const start = offset <= 0 ? 0 : found.words.lastIndexOf(' ', offset) + 1;
  const following = weighed
    .slice(at + 1)
    .filter((one) => one.block.kind !== 'picture' && one.words.length > 0);
  const prose = following.filter((one) => !HEADINGS.has(one.block.kind));
  const isHeading = HEADINGS.has(found.block.kind) && prose.length > 0;
  const words = [
    ...(isHeading ? [] : [found.words.slice(start)]),
    ...(prose.length > 0 ? prose : following).map((one) => one.words),
  ]
    .join(' ')
    .slice(0, EXCERPT_LENGTH * 2)
    .trim();

  return { excerpt: words.length === 0 ? null : shortened(words), picture: null };
};

export type { BookmarkPreview };

export { bookmarkPreviewOf };
