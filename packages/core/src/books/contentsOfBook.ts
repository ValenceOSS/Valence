import { readableTitle } from './readableTitle';
import type { BookContents } from '@ValenceContracts/schemas/Book';
import type { TypesetBlock } from '@ValenceContracts/schemas/BookText';

type ContentsEntry = BookContents['contents'][number];

const HEADINGS: ReadonlySet<TypesetBlock['kind']> = new Set(['title', 'heading', 'subheading']);

/**
 * Whether a book's contents are only the list of its files, which is what the server says where the
 * book has no table of contents of its own: one entry for each part, in order, with nothing deeper.
 *
 * @param entries - The contents the server gave.
 * @param partCount - How many parts the book has.
 * @returns Whether they are.
 */
const isListOfFiles = (entries: readonly ContentsEntry[], partCount: number): boolean =>
  entries.length === partCount &&
  entries.every((entry, at) => entry.part === at && entry.anchor === null && entry.depth === 0);

/**
 * A book's contents as a reader lists them: the book's own table of contents, without the entries
 * that lead to a part with nothing in it; or, where the book has none, the first heading of each
 * part that has one, so the list names the chapters rather than the files they are kept in.
 *
 * @param entries - The contents the server gave.
 * @param parts - Each part of the book, as the blocks it is set in.
 * @returns The contents to list.
 */
const contentsOfBook = (
  entries: readonly ContentsEntry[],
  parts: readonly (readonly TypesetBlock[])[],
): ContentsEntry[] => {
  const isEmpty = (part: number) => (parts[part] ?? []).length === 0;

  if (!isListOfFiles(entries, parts.length)) {
    return entries.filter((entry) => !isEmpty(entry.part));
  }

  const headed = parts.flatMap((blocks, part) => {
    const heading = blocks.find(
      (block) => HEADINGS.has(block.kind) && block.runs.some((run) => run.text.trim() !== ''),
    );

    return heading === undefined
      ? []
      : [
          {
            title: readableTitle(
              heading.runs
                .map((run) => run.text)
                .join('')
                .trim(),
            ),
            part,
            anchor: heading.anchors[0] ?? null,
            depth: heading.kind === 'subheading' ? 1 : 0,
          },
        ];
  });

  return headed.length > 0 ? headed : entries.filter((entry) => !isEmpty(entry.part));
};

export { contentsOfBook };
