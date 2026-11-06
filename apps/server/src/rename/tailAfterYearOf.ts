import { idTagOf } from '@ValenceServer/rename/idTagOf';

const EDGES = /^[\s._\-–—[\]()]+|[\s._\-–—[\]()]+$/gu;

/**
 * What a film's file name says after its year — its quality, such as `Remux-2160p`, or its edition,
 * such as `Extended Cut` — so a rename to the pattern keeps it, and whether it was set off by a dash,
 * as an edition is. A catalogue number such as `[tmdbid-603]` is not part of it.
 *
 * @param stem - The file's name without its extension.
 * @param year - The film's year.
 * @returns What follows the year, or null where the name gives no year or nothing after it.
 */
const tailAfterYearOf = (
  stem: string,
  year: number | null,
): { text: string; isDashed: boolean } | null => {
  if (year === null) {
    return null;
  }

  const at = stem.search(
    new RegExp(`[(\\[.\\s_-]${year.toString()}[)\\].\\s_-]|[(\\[.\\s_-]${year.toString()}$`, 'u'),
  );

  if (at === -1) {
    return null;
  }

  const after = stem.slice(at + year.toString().length + 1).replace(/^[)\]]/u, '');
  const tag = idTagOf(after);
  const rest = tag === null ? after : after.replace(tag, '');
  const text = rest.replaceAll(EDGES, '').trim();

  return text === '' ? null : { text, isDashed: /^\s*[-–—]\s/u.test(rest) };
};

export { tailAfterYearOf };
