import { parseSeriesPath } from './parseSeriesPath';
import { spaceOutName } from './spaceOutName';

const TITLE_WITH_YEAR = /(?<title>.+?)\s*\((?<year>[0-9]{4})\)/u;

/**
 * Names a programme from the folder holding it, the way Jellyfin does: `Title (Year)` is read as
 * both, a folder named like a release — `The.Show.S01.COMPLETE` — as the name before its season,
 * and dots or underscores between words become spaces.
 *
 * @param path - The programme's folder.
 * @returns The programme's name, and its year where the folder gave one.
 */
const resolveSeriesName = (path: string): { name: string; year: number | null } => {
  const folderName = path.slice(path.lastIndexOf('/') + 1);
  const titled = TITLE_WITH_YEAR.exec(folderName)?.groups;

  if (titled?.title !== undefined && titled.year !== undefined) {
    return { name: titled.title.trim(), year: Number(titled.year) };
  }

  const fromRules = parseSeriesPath(path);

  const name = fromRules ?? folderName;

  return { name: spaceOutName(name), year: null };
};

export { resolveSeriesName };
