import { EPISODE_EXPRESSIONS } from './EPISODE_EXPRESSIONS';

/**
 * Reads a programme's name out of a path named like a release of it — `The.Show.S01.COMPLETE`,
 * `/some/path/The Show s02e10 720p hdtv` — as the text before its season.
 *
 * @param path - The path.
 * @returns The programme's name, or null where no rule names both it and a season.
 */
const parseSeriesPath = (path: string): string | null => {
  for (const expression of EPISODE_EXPRESSIONS) {
    const found = expression.isNamed ? expression.pattern.exec(path)?.groups : undefined;

    if (
      found?.seriesname !== undefined &&
      found.seriesname !== '' &&
      found.seasonnumber !== undefined &&
      found.seasonnumber !== ''
    ) {
      return found.seriesname.replace(/^[ _.-]+|[ _.-]+$/g, '');
    }
  }

  return null;
};

export { parseSeriesPath };
