import type { Page } from 'mupdf';
import type { PdfLine, PdfPageText } from './PdfText';

/**
 * Reads the words on one page of a PDF as its blocks of lines, each line with how large and how
 * heavy its type is and where on the page it sits — what is needed to tell a heading from a
 * paragraph and a page number from the text, which the words alone do not say.
 *
 * @param page - The page.
 * @returns Its text, block by block.
 */
const readPdfPageText = (page: Page): PdfPageText => {
  const [left, top, , bottom] = page.getBounds();
  const blocks: PdfLine[][] = [];
  let block: PdfLine[] | null = null;
  let line: {
    chars: string[];
    sizes: number[];
    bold: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null = null;

  page.toStructuredText('preserve-whitespace').walk({
    beginTextBlock: () => {
      block = [];
    },
    beginLine: (bbox) => {
      line = {
        chars: [],
        sizes: [],
        bold: 0,
        top: bbox[1],
        bottom: bbox[3],
        left: bbox[0],
        right: bbox[2],
      };
    },
    onChar: (c, _origin, font, size) => {
      if (line === null) {
        return;
      }

      line.chars.push(c);
      line.sizes.push(size);

      if (font.isBold()) {
        line.bold += 1;
      }
    },
    endLine: () => {
      if (line !== null && block !== null) {
        const text = line.chars.join('').replace(/\s+/gu, ' ').trim();
        const sizes = [...line.sizes].sort((a, b) => a - b);

        if (text !== '') {
          block.push({
            text,
            size: sizes[Math.floor(sizes.length / 2)] ?? 0,
            isBold: line.bold * 2 > line.chars.length,
            top: line.top - top,
            bottom: line.bottom - top,
            left: line.left - left,
            right: line.right - left,
          });
        }
      }

      line = null;
    },
    endTextBlock: () => {
      if (block !== null && block.length > 0) {
        blocks.push(block);
      }

      block = null;
    },
  });

  return { height: bottom - top, blocks };
};

export { readPdfPageText };
