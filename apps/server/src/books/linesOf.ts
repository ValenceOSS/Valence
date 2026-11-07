import type { BookTextLine } from '@ValenceContracts/schemas/BookText';

/**
 * Lines of a book's text already in hand, handed out one at a time as lines still being read are.
 *
 * @param lines - The lines.
 * @returns Them, to be read as they are read from a book being opened.
 */
const linesOf = (lines: readonly BookTextLine[]): AsyncIterable<BookTextLine> => ({
  [Symbol.asyncIterator]: () => {
    let at = 0;

    return {
      next: () => {
        const line = lines[at];

        at += 1;

        return Promise.resolve(
          line === undefined
            ? { done: true as const, value: undefined }
            : { done: false as const, value: line },
        );
      },
    };
  },
});

export { linesOf };
