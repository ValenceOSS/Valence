import { rangeOf } from '@ValenceRequests/releases/rangeOf';

type Episodes = {
  seasons: number[];
  episodes: number[];
  absoluteEpisodes: number[];
  airDate: string | null;
  isCompleteSeries: boolean;
};

const RESOLUTION_OR_CODEC = /^(2160|1080|720|576|480|264|265|266)$/;

/**
 * Reads anime's absolute numbering — `One Piece - 1100`, `E1100`, `1100 & 1101`, `1100-1155` —
 * from a name that numbers its episodes without seasons, as fansub releases do.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The episodes, or none.
 */
const readAbsolute = (spaced: string): number[] => {
  const range =
    /(?:^|\s|\()(?:-\s?|E|Episode\s)?(\d{2,4})\s?(?:-|&|~)\s?(\d{2,4})(?=[\s)\]]|$)/i.exec(spaced);

  if (
    range?.[1] !== undefined &&
    range[2] !== undefined &&
    !RESOLUTION_OR_CODEC.test(range[1]) &&
    Number(range[2]) > Number(range[1])
  ) {
    return rangeOf(Number(range[1]), Number(range[2]));
  }

  const single = /(?:\s-\s?|\sE|\s)(\d{2,4})(?:v\d)?(?=[\s[(]|$)/.exec(spaced);

  return single?.[1] === undefined || RESOLUTION_OR_CODEC.test(single[1])
    ? []
    : [Number(single[1])];
};

/**
 * Which seasons and episodes a release holds: `S02E05`, several in one (`S01E01E02`, `S01E01-E03`),
 * a whole season (`S02`, `Season 2`) or several (`S01-S09`, `S01 S09`), `1x05`, a daily show's air
 * date, or anime's absolute numbering where nothing else says — which is only looked for in a
 * name that starts with a group in brackets, or numbers an episode after a dash, so a film's number
 * is never taken for one. A complete series with no seasons named says so.
 *
 * @param spaced - The name, with its words spaced.
 * @returns What it holds; empty for a film.
 */
const readEpisodes = (spaced: string): Episodes => {
  const nothing: Episodes = {
    seasons: [],
    episodes: [],
    absoluteEpisodes: [],
    airDate: null,
    isCompleteSeries: /\bcomplete (series|collection|seasons)\b/i.test(spaced),
  };
  const episode = /\bS(\d{1,2}) ?E(\d{1,4})((?:(?: ?-? ?E| ?- ?)\d{1,4})*)\b/i.exec(spaced);

  if (episode?.[1] !== undefined && episode[2] !== undefined) {
    const first = Number(episode[2]);
    const more = [...(episode[3] ?? '').matchAll(/\d{1,4}/g)].map((found) => Number(found[0]));
    const isRange = /-/.test(episode[3] ?? '') && more.length === 1;

    return {
      ...nothing,
      seasons: [Number(episode[1])],
      episodes: isRange ? rangeOf(first, more[0] ?? first) : [first, ...more],
    };
  }

  const crossed = /\b(\d{1,2})x(\d{2,3})\b/.exec(spaced);

  if (
    crossed?.[1] !== undefined &&
    crossed[2] !== undefined &&
    !/\d{3,4}x\d{3,4}/.test(crossed[0])
  ) {
    return { ...nothing, seasons: [Number(crossed[1])], episodes: [Number(crossed[2])] };
  }

  const seasons =
    /\bS(\d{1,2}) ?(?:-|to| ) ?S(\d{1,2})\b/i.exec(spaced) ??
    /\bSeasons? ?(\d{1,2}) ?(?:-|to|&) ?(\d{1,2})\b/i.exec(spaced);

  if (seasons?.[1] !== undefined && seasons[2] !== undefined) {
    return { ...nothing, seasons: rangeOf(Number(seasons[1]), Number(seasons[2])) };
  }

  const season = /\bS(\d{1,2})\b|\bSeason ?(\d{1,2})\b/i.exec(spaced);

  if (season !== null) {
    return { ...nothing, seasons: [Number(season[1] ?? season[2])] };
  }

  const aired = /\b((?:19|20)\d{2})[ -](0[1-9]|1[0-2])[ -](0[1-9]|[12]\d|3[01])\b/.exec(spaced);

  if (aired !== null) {
    return { ...nothing, airDate: `${aired[1] ?? ''}-${aired[2] ?? ''}-${aired[3] ?? ''}` };
  }

  const isNumbered =
    spaced.startsWith('[') ||
    /\s-\s?E?(?!(?:19|20)\d{2}\b)\d{2,4}\b|\(\d{2,4}-\d{2,4}\)/i.test(spaced);

  return isNumbered && !nothing.isCompleteSeries
    ? { ...nothing, absoluteEpisodes: readAbsolute(spaced.replace(/^\[[^\]]*\]\s*/, '')) }
    : nothing;
};

export type { Episodes };

export { readEpisodes };
