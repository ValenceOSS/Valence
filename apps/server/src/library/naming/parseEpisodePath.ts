import { EPISODE_EXPRESSIONS } from './EPISODE_EXPRESSIONS';
import { MULTIPLE_EPISODE_EXPRESSIONS } from './MULTIPLE_EPISODE_EXPRESSIONS';
import { readAirDate } from './readAirDate';
import { readWholeNumber } from './readWholeNumber';
import type { EpisodeExpression } from './EpisodeExpression.types';
import type { EpisodePath, EpisodePathOptions } from './EpisodePath.types';

const NOTHING: EpisodePath = {
  isSuccess: false,
  seriesName: null,
  seasonNumber: null,
  episodeNumber: null,
  endingEpisodeNumber: null,
  isByDate: false,
  year: null,
  month: null,
  day: null,
};

const RESOLUTION_AFTER = /[0-9ip]/i;

/**
 * Whether a number read as a season cannot be one, as `Series Special (1920x1080)` reads as season
 * 1920 without it.
 *
 * @param season - The season as read.
 * @returns Whether to throw the reading away.
 */
const isImpossibleSeason = (season: number | null): boolean =>
  season !== null && ((season >= 200 && season < 1928) || season > 2500);

/**
 * Reads one path with one rule.
 *
 * @param path - The path.
 * @param expression - The rule.
 * @returns What the rule read, successful or not.
 */
const readWith = (path: string, expression: EpisodeExpression): EpisodePath => {
  const name = expression.isByDate ? path.replaceAll('_', '-') : path;
  const match = expression.pattern.exec(name);

  if (match === null) {
    return NOTHING;
  }

  if (expression.isByDate) {
    const date = readAirDate(match[0]);

    return {
      ...NOTHING,
      isSuccess: true,
      isByDate: true,
      year: date?.year ?? null,
      month: date?.month ?? null,
      day: date?.day ?? null,
    };
  }

  const found = match.groups ?? {};
  const seasonNumber = readWholeNumber(expression.isNamed ? found.seasonnumber : match[1]);
  const episodeNumber = readWholeNumber(expression.isNamed ? found.epnumber : match[2]);
  const ending = expression.isNamed ? found.endingepnumber : undefined;
  const endingAt = match.indices?.groups?.endingepnumber?.[1] ?? -1;
  const endingNumber =
    ending === undefined || RESOLUTION_AFTER.test(name.charAt(endingAt))
      ? null
      : readWholeNumber(ending);

  return {
    ...NOTHING,
    isSuccess: episodeNumber !== null && !isImpossibleSeason(seasonNumber),
    seriesName: expression.isNamed ? (found.seriesname ?? '') : null,
    seasonNumber,
    episodeNumber,
    endingEpisodeNumber:
      endingNumber !== null && episodeNumber !== null && endingNumber >= episodeNumber
        ? endingNumber
        : null,
  };
};

/**
 * Fills in what the rule that read an episode could not say — the programme's name, and where one
 * file holds several episodes, the last of them.
 *
 * @param path - The path.
 * @param read - What was read so far.
 * @returns It with whatever else the rules could add.
 */
const fillAdditional = (path: string, read: EpisodePath): EpisodePath => {
  const expressions = [
    ...(read.seriesName === null || read.seriesName === ''
      ? EPISODE_EXPRESSIONS.filter((expression) => expression.isNamed)
      : []),
    ...MULTIPLE_EPISODE_EXPRESSIONS,
  ];
  let filled = read;

  for (const expression of expressions) {
    const more = readWith(path, expression);

    if (!more.isSuccess) {
      continue;
    }

    if (filled.seriesName === null || filled.seriesName === '') {
      filled = { ...filled, seriesName: more.seriesName };
    }

    if (
      filled.endingEpisodeNumber === null &&
      more.endingEpisodeNumber !== null &&
      filled.episodeNumber !== null &&
      more.endingEpisodeNumber >= filled.episodeNumber
    ) {
      filled = { ...filled, endingEpisodeNumber: more.endingEpisodeNumber };
    }

    if (
      filled.seriesName !== null &&
      filled.seriesName !== '' &&
      (filled.episodeNumber === null || filled.endingEpisodeNumber !== null)
    ) {
      break;
    }
  }

  return filled;
};

/**
 * Reads which programme, season and episode a path names, trying Jellyfin's rules in Jellyfin's
 * order and keeping the first that reads an episode — `S01E02`, `1x02`, `ep02`, an air date, an
 * anime's absolute number, a bare `02` inside a season folder.
 *
 * @param path - The file's path, or a folder's where it stands for the episode.
 * @param options - Whether the path is a folder, and which kinds of rule to limit the reading to.
 * @returns What the path names.
 */
const parseEpisodePath = (path: string, options: EpisodePathOptions = {}): EpisodePath => {
  const read = options.isDirectory === true ? `${path}.mp4` : path;
  const chosen = EPISODE_EXPRESSIONS.filter(
    (expression) =>
      (options.supportsAbsoluteNumbers === undefined ||
        expression.supportsAbsoluteNumbers === options.supportsAbsoluteNumbers) &&
      (options.isNamed === undefined || expression.isNamed === options.isNamed) &&
      (options.isOptimistic === undefined || expression.isOptimistic === options.isOptimistic),
  );
  const found = chosen.map((expression) => readWith(read, expression)).find((one) => one.isSuccess);

  if (found === undefined) {
    return NOTHING;
  }

  if (options.fillExtendedInfo === false) {
    return found;
  }

  const filled = fillAdditional(read, found);

  return filled.seriesName === null
    ? filled
    : {
        ...filled,
        seriesName: filled.seriesName
          .trim()
          .replace(/^[_.-]+|[_.-]+$/g, '')
          .trim(),
      };
};

export { parseEpisodePath };
