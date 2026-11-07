import sharp from 'sharp';
import { readBookDocument } from '@ValenceCore/books/readBookDocument';
import { typesetBlocksOf } from '@ValenceCore/books/typesetBlocksOf';
import type { ReflowBook } from './BookFile';
import type { BookTextPart } from './BookTextPart';

/**
 * Reads the parts of a book that reflows as the phone sets them, one at a time and in the order
 * asked for: each part cleaned, read into its paragraphs, headings and pictures, and every picture
 * measured from the picture itself, so the phone can leave room for it before it has arrived.
 *
 * @param opened - The book, opened once for every part.
 * @param order - Which parts to read, in the order to read them.
 * @param insideOf - Where in the book a picture's address points, so it can be measured.
 * @returns Each part as it is read, with its number.
 */
async function* readBookText(
  opened: ReflowBook,
  order: readonly number[],
  insideOf: (address: string) => string | null,
): AsyncGenerator<{ part: number } & BookTextPart> {
  for (const part of order) {
    const html = (await opened.readDocument(part).catch(() => null)) ?? '';
    const blocks = typesetBlocksOf(readBookDocument(html));

    for (const block of blocks) {
      const picture = block.picture;
      const inside = picture === undefined ? null : insideOf(picture.address);

      if (picture !== undefined && inside !== null) {
        const read = await opened.readResource(inside).catch(() => null);
        const measured =
          read === null
            ? null
            : await sharp(read.bytes)
                .metadata()
                .catch(() => null);

        if (measured !== null) {
          block.picture = { ...picture, width: measured.width, height: measured.height };
        }
      }
    }

    yield { part, blocks, html };
  }
}

export { readBookText };
