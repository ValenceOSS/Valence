import { readWholeNumber } from './readWholeNumber';

const KEYWORDS =
  '시즌|シーズン|сезон|season|sæson|saison|staffel|series|stagione|säsong|seizoen|seasong|sezon|sezona|sezóna|sezonul|série|séria|serie|seria|temporada|kausi';

const NUMBER_FIRST = new RegExp(
  `^\\s*((?<seasonnumber>(?=(?<digits>\\d+))\\k<digits>)(?:st|nd|rd|th|\\.)*(?!\\s*[Ee]\\d+))\\s*(?:${KEYWORDS})\\s*(?<rightpart>.*)$`,
  'iu',
);

const KEYWORD_FIRST = new RegExp(
  `^\\s*(?:${KEYWORDS})\\s*(?<seasonnumber>\\d+?)(?=\\d{3,4}p|[^\\d]|$)(?!\\s*[Ee]\\d)(?<rightpart>.*)$`,
  'iu',
);

const SEASON_PREFIX = /[sS](\d{1,4})(?!\d|[eE]\d)(?=\.|_|-|\[|\]|\s|$)/u;

const SEASON_KEYWORD = new RegExp(KEYWORDS, 'iu');

const SEPARATORS = /[ ._\-[\]]/gu;

/**
 * Takes every occurrence of one piece of text out of another, ignoring case.
 *
 * @param text - What to take it out of.
 * @param piece - What to take out.
 * @returns The text without it.
 */
const withoutPiece = (text: string, piece: string): string =>
  piece === ''
    ? text
    : text.replace(new RegExp(piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu'), '');

/**
 * Reads the season a folder inside a programme stands for, the way Jellyfin does — `Season 2`,
 * `S02`, `2nd Season`, `Staffel 2`, `시즌 2`, a bare `02`, or `Specials` for season 0 — with the
 * programme's own name taken out first, so `Show Season 2` inside `Show` reads the same.
 *
 * Where the library is not known to hold programmes, a bare number or `Specials` is not trusted,
 * and a season has to be named with a word for one.
 *
 * @param path - The folder.
 * @param parentPath - The programme's folder above it, where known.
 * @param supportsSpecialAliases - Whether `Specials` and `Extras` mean season 0.
 * @param supportsNumericFolders - Whether a folder named only a number is a season.
 * @returns The season, and whether the folder is a season folder at all.
 */
const parseSeasonFolder = (
  path: string,
  parentPath: string | null,
  supportsSpecialAliases = true,
  supportsNumericFolders = true,
): { seasonNumber: number | null; isSeasonFolder: boolean } => {
  const folderName = path.slice(path.lastIndexOf('/') + 1);
  const prefixed = SEASON_PREFIX.exec(folderName);
  const prefixedNumber = readWholeNumber(prefixed?.[1]);

  if (prefixedNumber !== null) {
    return { seasonNumber: prefixedNumber, isSeasonFolder: true };
  }

  const parentName = parentPath === null ? null : parentPath.slice(parentPath.lastIndexOf('/') + 1);
  const cleaned = withoutPiece(
    folderName.replace(SEPARATORS, ''),
    parentName === null ? '' : parentName.replace(SEPARATORS, ''),
  );

  if (supportsSpecialAliases && /^(?:specials|extras)$/iu.test(cleaned)) {
    return { seasonNumber: 0, isSeasonFolder: true };
  }

  const bare = supportsNumericFolders ? readWholeNumber(cleaned) : null;

  if (bare !== null) {
    return { seasonNumber: bare, isSeasonFolder: true };
  }

  const isMixed = !supportsNumericFolders && !supportsSpecialAliases;
  const before = NUMBER_FIRST.exec(cleaned);
  const match = before ?? KEYWORD_FIRST.exec(cleaned);

  if (match !== null && isMixed && !SEASON_KEYWORD.test(folderName)) {
    return { seasonNumber: null, isSeasonFolder: false };
  }

  const seasonNumber = readWholeNumber(match?.groups?.seasonnumber);

  return { seasonNumber, isSeasonFolder: seasonNumber !== null };
};

export { parseSeasonFolder };
