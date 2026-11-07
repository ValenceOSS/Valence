import type { PdfPart } from './PdfText';

const PAGES_A_PART = 20;

/**
 * Splits a PDF into the parts a reader moves through: one for each chapter its own contents name,
 * where it names them, and otherwise a run of pages at a time, so that no part is the whole book.
 *
 * @param pageCount - How many pages there are.
 * @param chapters - Where its contents say each chapter starts, in order.
 * @param untitled - What to call a part that has no name of its own, given its first page and the
 *   page after its last.
 * @returns The parts, each from its first page up to, not including, the next part's.
 */
const pdfPartsOf = (
  pageCount: number,
  chapters: readonly { title: string; page: number }[],
  untitled: (from: number, to: number) => string,
): PdfPart[] => {
  const starts = chapters
    .filter((one) => one.page >= 0 && one.page < pageCount)
    .filter((one, at, all) => at === 0 || one.page > (all[at - 1]?.page ?? -1));

  if (starts.length < 2) {
    return Array.from({ length: Math.ceil(pageCount / PAGES_A_PART) }, (_, at) => {
      const from = at * PAGES_A_PART;
      const to = Math.min(from + PAGES_A_PART, pageCount);

      return { title: untitled(from, to), from, to };
    });
  }

  const first = starts[0]?.page ?? 0;
  const lead = first > 0 ? [{ title: untitled(0, first), from: 0, to: first }] : [];

  return [
    ...lead,
    ...starts.map((one, at) => ({
      title: one.title,
      from: one.page,
      to: starts[at + 1]?.page ?? pageCount,
    })),
  ];
};

export { pdfPartsOf };
