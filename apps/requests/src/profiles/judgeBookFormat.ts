import { saying } from '@ValenceI18n/saying';
import { readBookFormat } from '@ValenceCore/releases/readBookFormat';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const PREFERRED: Readonly<Record<string, { pattern: RegExp; points: number }>> = {
  EPUB: { pattern: /\bepub\b/i, points: 30 },
  AZW3: { pattern: /\b(?:azw3|kfx)\b/i, points: 20 },
  MOBI: { pattern: /\bmobi\b/i, points: 10 },
  M4B: { pattern: /\bm4b\b/i, points: 30 },
  MP3: { pattern: /\bmp3\b/i, points: 10 },
};

const EBOOK_ORDER = ['EPUB', 'AZW3', 'MOBI'];

const AUDIOBOOK_ORDER = ['M4B', 'MP3'];

const RETAIL = { pattern: /\bretail\b/i, points: 10 };

const SCANNED = /\b(?:scan(?:ned)?|ocr)\b/i;

const ABRIDGED = /(?<!un)abridged/i;

/**
 * How a book release ranks by its format: an ebook EPUB first, then AZW3, then MOBI, and retail
 * before a scan; an audiobook M4B first, then MP3 — and an abridged audiobook refused outright,
 * since only the whole book is wanted.
 *
 * @param release - The release.
 * @returns Its score, why, and anything that refuses it.
 */
const judgeBookFormat = (
  release: Pick<Release, 'title' | 'categories'>,
): { score: number; rejections: Said[]; reasons: Said[] } => {
  const format = readBookFormat(release);
  const order = format === 'audiobook' ? AUDIOBOOK_ORDER : EBOOK_ORDER;
  const named = order.find((name) => PREFERRED[name]?.pattern.test(release.title) === true);
  const points = named === undefined ? 0 : (PREFERRED[named]?.points ?? 0);
  const isRetail = format === 'ebook' && RETAIL.pattern.test(release.title);
  const isScanned = format === 'ebook' && SCANNED.test(release.title);
  const isAbridged = format === 'audiobook' && ABRIDGED.test(release.title);

  return {
    score: points + (isRetail ? RETAIL.points : 0) - (isScanned ? RETAIL.points : 0),
    rejections: isAbridged ? [saying('requests.profiles.judgeBookFormat.itIsAbridged')] : [],
    reasons: [
      ...(named === undefined
        ? []
        : [
            saying(
              format === 'audiobook'
                ? 'requests.profiles.judgeBookFormat.formatPreferredForAudiobooks'
                : 'requests.profiles.judgeBookFormat.formatPreferredForEbooks',
              { format: named, points },
            ),
          ]),
      ...(isRetail
        ? [saying('requests.profiles.judgeBookFormat.retail', { points: RETAIL.points })]
        : []),
      ...(isScanned
        ? [saying('requests.profiles.judgeBookFormat.scanned', { points: RETAIL.points })]
        : []),
    ],
  };
};

export { judgeBookFormat };
