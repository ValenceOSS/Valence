import { readableTitle } from './readableTitle';
import type { BookContents } from '@ValenceContracts/schemas/Book';
import type { TypesetBlock } from '@ValenceContracts/schemas/BookText';

const HEADINGS: ReadonlySet<TypesetBlock['kind']> = new Set(['title', 'heading', 'subheading']);

/**
 * What to call a part of a book above its pages: its own entry in the contents, where it has one;
 * otherwise the first heading it holds, as a page of praise or a dedication the contents leave out
 * has; otherwise the entry before it, as a chapter split across files is named by its first file;
 * otherwise the book's title.
 *
 * @param entries - The book's contents.
 * @param blocks - The part, as the blocks it is set in, where it has arrived.
 * @param part - Which part.
 * @param title - The book's title.
 * @returns The name, title-cased where the book shouts it.
 */
const nameOfPart = (
  entries: BookContents['contents'],
  blocks: readonly TypesetBlock[],
  part: number,
  title: string,
): string => {
  const own = entries.find((entry) => entry.part === part);
  const heading = blocks.find(
    (block) => HEADINGS.has(block.kind) && block.runs.some((run) => run.text.trim() !== ''),
  );
  const before = entries.filter((entry) => entry.part < part).at(-1);

  return readableTitle(
    own?.title ??
      heading?.runs
        .map((run) => run.text)
        .join('')
        .trim() ??
      before?.title ??
      title,
  );
};

export { nameOfPart };
