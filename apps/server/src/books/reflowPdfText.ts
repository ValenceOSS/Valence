import type { PdfLine, PdfPageText } from './PdfText';

const MARGIN_SHARE = 0.08;

const SHORTEST_REPEAT_SHARE = 0.3;

const LONGEST_RUNNING_LINE = 80;

const HEADING_SCALE = 1.2;

const TITLE_SCALE = 1.6;

const LONGEST_HEADING = 140;

const MARGIN_QUANTILE = 0.2;

const MEASURE_QUANTILE = 0.8;

const INDENT_EMS = 0.8;

const SHORT_LINE_EMS = 3;

const GAP_SCALE = 1.5;

const ENDS_A_SENTENCE = /[.!?:;"”’)\]]$/u;

/**
 * Escapes text for HTML.
 *
 * @param text - The text.
 * @returns It, safe to put between tags.
 */
const escaped = (text: string): string =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');

/**
 * A line with its numbers taken out, so "Chapter One 12" and "Chapter One 13" read as the same
 * running header.
 *
 * @param text - The line.
 * @returns Its shape.
 */
const shapeOf = (text: string): string => text.replace(/\d+/gu, '#').toLowerCase();

/**
 * Joins the lines of a paragraph back into one run of text, mending a word a line broke with a
 * hyphen.
 *
 * @param lines - The lines, in order.
 * @returns The paragraph.
 */
const joinLines = (lines: readonly string[]): string =>
  lines.reduce((joined, next) => {
    if (joined === '') {
      return next;
    }

    return /\p{L}-$/u.test(joined) && /^\p{Ll}/u.test(next)
      ? `${joined.slice(0, -1)}${next}`
      : `${joined} ${next}`;
  }, '');

/**
 * Turns the text of some pages of a PDF back into something that reflows: paragraphs, and headings
 * where the type is set larger than the text around it, with the page numbers and the running
 * headers and footers that repeat at the top and foot of the pages left out, and a paragraph a page
 * break cut in two joined again.
 *
 * Paragraphs are found from the lines themselves rather than from how the file groups them, since a
 * scanned and recognised book often makes every line a block of its own: a line starts a paragraph
 * where it is indented, where it stands further below the one before than lines usually do, or where
 * the line before ended a sentence short of the margin.
 *
 * @param pages - The pages' text, in order.
 * @returns The text as HTML.
 */
const reflowPdfText = (pages: readonly PdfPageText[]): string => {
  const inMargin = (line: PdfLine, height: number) =>
    line.text.length <= LONGEST_RUNNING_LINE &&
    (line.bottom < height * MARGIN_SHARE || line.top > height * (1 - MARGIN_SHARE));
  const seen = new Map<string, number>();

  for (const page of pages) {
    const shapes = new Set(
      page.blocks
        .flat()
        .filter((line) => inMargin(line, page.height))
        .map((line) => shapeOf(line.text)),
    );

    for (const shape of shapes) {
      seen.set(shape, (seen.get(shape) ?? 0) + 1);
    }
  }

  const repeats = Math.max(2, Math.ceil(pages.length * SHORTEST_REPEAT_SHARE));
  const isRunning = (line: PdfLine, height: number) =>
    inMargin(line, height) &&
    (/^[\divxlc\s.\-–—]+$/iu.test(line.text) ||
      (pages.length > 1 && (seen.get(shapeOf(line.text)) ?? 0) >= repeats));

  const weighed = pages.flatMap((page) =>
    page.blocks.flat().flatMap((line) => Array.from({ length: line.text.length }, () => line.size)),
  );
  const sorted = [...weighed].sort((a, b) => a - b);
  const body = sorted[Math.floor(sorted.length / 2)] ?? 0;

  const parts: { tag: 'h1' | 'h2' | 'p'; lines: string[] }[] = [];
  let isOpen = false;

  for (const page of pages) {
    const lines = page.blocks.flat().filter((line) => !isRunning(line, page.height));
    const lefts = lines.map((line) => Math.round(line.left)).sort((a, b) => a - b);
    const rights = lines.map((line) => line.right).sort((a, b) => a - b);
    const margin = lefts[Math.floor(lefts.length * MARGIN_QUANTILE)] ?? 0;
    const measure = rights[Math.floor(rights.length * MEASURE_QUANTILE)] ?? 0;
    const gaps = lines
      .slice(1)
      .map((line, at) => line.top - (lines[at]?.top ?? line.top))
      .filter((gap) => gap > 0)
      .sort((a, b) => a - b);
    const leading = gaps[Math.floor(gaps.length / 2)] ?? 0;

    lines.forEach((line, at) => {
      const before = lines[at - 1];
      const last = parts.at(-1);
      const isHeading =
        body > 0 &&
        line.text.length <= LONGEST_HEADING &&
        (line.size >= body * HEADING_SCALE || (line.isBold && line.size >= body));
      const tag = isHeading ? (line.size >= body * TITLE_SCALE ? 'h1' : 'h2') : 'p';
      const isIndented = line.left > margin + line.size * INDENT_EMS;
      const isApart =
        before !== undefined && leading > 0 && line.top - before.top > leading * GAP_SCALE;
      const endedShort =
        before !== undefined &&
        before.right < measure - before.size * SHORT_LINE_EMS &&
        ENDS_A_SENTENCE.test(before.text);
      const carriesOn =
        last !== undefined &&
        last.tag === tag &&
        (before === undefined
          ? tag === 'p' && isOpen && /^\p{Ll}/u.test(line.text)
          : tag === 'h1' || tag === 'h2'
            ? !isApart
            : !isIndented && !isApart && !endedShort);

      if (carriesOn) {
        last.lines.push(line.text);
      } else {
        parts.push({ tag, lines: [line.text] });
      }

      isOpen = tag === 'p' && !ENDS_A_SENTENCE.test(line.text);
    });
  }

  return parts.map(({ tag, lines }) => `<${tag}>${escaped(joinLines(lines))}</${tag}>`).join('\n');
};

export { reflowPdfText };
