import { isSameTitle } from '@ValenceRequests/mediaRequests/isSameTitle';
import { reduceTitle } from '@ValenceRequests/mediaRequests/reduceTitle';
import { namesInTitle } from '@ValenceRequests/mediaRequests/namesInTitle';
import type { AnimeFacts, AnimeNumbering } from '@ValenceContracts/schemas/Anime';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Matchable = Pick<RequestItemRecord, 'id' | 'season' | 'episode' | 'airDate' | 'title'>;

type Place = { season: number; episode: number };

type Reading = { numbering: AnimeNumbering; episodes: Place[] };

type AnimeMatch<Item> =
  | { kind: 'matched'; items: Item[]; numbering: AnimeNumbering | null }
  | { kind: 'ambiguous'; readings: Reading[]; guess: AnimeNumbering }
  | { kind: 'none' };

const SEASON_SUFFIX =
  /\s+(?:(\d{1,2})(?:st|nd|rd|th)\s+season|season\s+(\d{1,2})|s(\d{1,2})|part\s+(\d{1,2})|cour\s+(\d{1,2}))$/i;

/**
 * Whether a release names the show itself or one of its cours: a cour by its own name, or the
 * show's name followed by a season, part or cour number; nothing where it names neither.
 *
 * @param title - The title the release gives.
 * @param shown - Every name the show goes by.
 * @param anime - Its cours.
 * @returns The cour it names, null for the show, or undefined where it is not this show.
 */
const namedIn = (
  title: string,
  shown: readonly string[],
  anime: AnimeFacts,
): number | null | undefined => {
  const isShow = shown.some((name) => isSameTitle(title, name));
  const cour = anime.cours.find(
    (one) =>
      one.cour > 1 &&
      [one.name, ...one.names].some(
        (name) =>
          name !== null &&
          isSameTitle(title, name) &&
          !shown.some((show) => isSameTitle(name, show)),
      ),
  );

  if (cour !== undefined) {
    return cour.cour;
  }

  if (isShow) {
    return null;
  }

  const suffix = SEASON_SUFFIX.exec(title);
  const number = Number(suffix?.[1] ?? suffix?.[2] ?? suffix?.[3] ?? suffix?.[4] ?? suffix?.[5]);

  return suffix !== null && shown.some((name) => isSameTitle(title.slice(0, suffix.index), name))
    ? number
    : undefined;
};

/**
 * Which of a show's regular episodes each way of numbering a release could mean: the catalogue's
 * own seasons and episodes; a cour and the episode's place in it; or the episode's number counted
 * from the very first. A reading is only kept where every number in the release means an episode
 * there is, and, where the release named a cour, one in that cour.
 *
 * @param parsed - What the release's name says.
 * @param anime - The show's cours and numbers.
 * @param named - The cour the release named, where it named one.
 * @returns Each way it could be read.
 */
const readingsOf = (parsed: ParsedRelease, anime: AnimeFacts, named: number | null): Reading[] => {
  const regular = anime.episodes
    .filter((one) => one.season > 0)
    .toSorted((left, right) => left.season - right.season || left.episode - right.episode);
  const inCour = (cour: number) => regular.filter((one) => one.cour === cour);
  const resolve = (
    numbering: AnimeNumbering,
    found: ((typeof regular)[number] | undefined)[],
  ): Reading[] =>
    found.length > 0 &&
    found.every((one) => one !== undefined && (named === null || one.cour === named))
      ? [
          {
            numbering,
            episodes: found.flatMap((one) =>
              one === undefined ? [] : [{ season: one.season, episode: one.episode }],
            ),
          },
        ]
      : [];
  const [season] = parsed.seasons;

  if (season !== undefined && parsed.episodes.length > 0) {
    return [
      ...resolve(
        'aired',
        parsed.episodes.map((episode) =>
          regular.find((one) => one.season === season && one.episode === episode),
        ),
      ),
      ...resolve(
        'perCour',
        parsed.episodes.map((episode) => inCour(season)[episode - 1]),
      ),
    ];
  }

  if (parsed.seasons.length > 0) {
    return [
      ...resolve(
        'aired',
        parsed.seasons.flatMap((one) => {
          const all = regular.filter((episode) => episode.season === one);

          return all.length === 0 ? [undefined] : all;
        }),
      ),
      ...resolve(
        'perCour',
        parsed.seasons.flatMap((one) => {
          const all = inCour(one);

          return all.length === 0 ? [undefined] : all;
        }),
      ),
    ];
  }

  if (parsed.absoluteEpisodes.length === 0) {
    return [];
  }

  return [
    ...resolve(
      'absolute',
      parsed.absoluteEpisodes.map((number) => regular.find((one) => one.absolute === number)),
    ),
    ...resolve(
      'perCour',
      parsed.absoluteEpisodes.map((number) => inCour(named ?? 1)[number - 1]),
    ),
  ];
};

/**
 * Whether two readings mean the same episodes.
 *
 * @param left - One reading.
 * @param right - The other.
 * @returns Whether they agree.
 */
const isSameReading = (left: Reading, right: Reading): boolean =>
  left.episodes.length === right.episodes.length &&
  left.episodes.every((one, at) => {
    const other = right.episodes.at(at);

    return other?.season === one.season && other.episode === one.episode;
  });

/**
 * Which of an anime request's episodes a release holds, however it numbers them: the catalogue's
 * seasons (`S02E05`), a cour and the place in it (`S2 - 05`, or a cour's own name and `- 05`), the
 * number counted from the first episode (`- 30`), or a range of any of those for a batch.
 *
 * A release is only matched where every way of reading it that could be true agrees. Where they
 * disagree, the way its release group was answered for before is taken; then any reading claiming an
 * episode that had not aired when the release was made is dropped; then a reading of one episode
 * whose title the release gives. Before those, a release naming a season the show's own cours are
 * named by, such as `S3` for a cour called "Season 3", is read as that cour. Where somebody has said
 * how this release numbers them, that is taken before anything else. Anything still unsettled is held for somebody to answer, with a
 * best guess: the place in the cour where it named a cour or wrote `S2 - 05`, the catalogue's own
 * numbering where it wrote `S02E05`, and otherwise the number counted from the first.
 *
 * @param request - What was asked for, its cours and how each release group numbers its releases.
 * @param items - What it is waiting for.
 * @param parsed - What the release's name says.
 * @param releaseTitle - The release's whole name, for an episode title in it.
 * @param madeAt - The day the release was made, where known.
 * @param isTitleChecked - Whether a release must be named for the request.
 * @param numbering - How somebody said this release numbers its episodes, where they did.
 * @returns The episodes it holds and how it was read, the readings to choose between, or nothing.
 */
const matchAnimeRelease = <Item extends Matchable>(
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'anime' | 'numberingByGroup'>,
  items: readonly Item[],
  parsed: ParsedRelease,
  releaseTitle: string,
  madeAt: string | null,
  isTitleChecked = true,
  numbering: AnimeNumbering | null = null,
): AnimeMatch<Item> => {
  const anime = request.anime ?? null;

  if (anime === null) {
    return { kind: 'none' };
  }

  const shown = [
    request.title,
    ...request.aliases,
    ...[anime.names.english, anime.names.romaji, anime.names.native].filter(
      (name): name is string => name !== null,
    ),
    ...anime.names.others,
  ];
  const named = isTitleChecked
    ? namesInTitle(parsed.title)
        .map((name) => namedIn(name, shown, anime))
        .find((one) => one !== undefined)
    : null;

  if (named === undefined) {
    return { kind: 'none' };
  }

  const found = readingsOf(parsed, anime, named);
  const readings = found.filter(
    (reading, at) => found.findIndex((other) => isSameReading(other, reading)) === at,
  );
  const holding = (reading: Reading, numbering: AnimeNumbering | null): AnimeMatch<Item> => {
    const held = items.filter((item) =>
      reading.episodes.some((one) => one.season === item.season && one.episode === item.episode),
    );

    return held.length === 0 ? { kind: 'none' } : { kind: 'matched', items: held, numbering };
  };
  const [only] = readings;

  if (only === undefined) {
    return { kind: 'none' };
  }

  if (readings.length === 1) {
    return holding(only, found.length > 1 ? null : only.numbering);
  }

  const remembered =
    numbering ?? (parsed.group === null ? undefined : request.numberingByGroup?.[parsed.group]);
  const answered = readings.find((reading) => reading.numbering === remembered);

  if (answered !== undefined) {
    return holding(answered, answered.numbering);
  }

  const [season] = parsed.seasons;
  const seasonNamed =
    season === undefined
      ? undefined
      : anime.cours.find((cour) =>
          [cour.name, ...cour.names].some(
            (name) =>
              name !== null &&
              new RegExp(
                `(?:\\bseason\\s*0?${season.toString()}|\\b${season.toString()}(?:st|nd|rd|th)\\s+season)\\b`,
                'i',
              ).test(name),
          ),
        );
  const courOf = (place: Place) =>
    anime.episodes.find((one) => one.season === place.season && one.episode === place.episode)
      ?.cour ?? null;
  const inNamedSeason =
    seasonNamed === undefined
      ? []
      : readings.filter((reading) =>
          reading.episodes.every((place) => courOf(place) === seasonNamed.cour),
        );
  const [byItsSeason] = inNamedSeason;

  if (inNamedSeason.length === 1 && byItsSeason !== undefined) {
    return holding(byItsSeason, byItsSeason.numbering);
  }

  const airedOf = (place: Place) =>
    items.find((item) => item.season === place.season && item.episode === place.episode)?.airDate ??
    null;
  const couldBe = readings.filter(
    (reading) =>
      madeAt === null ||
      reading.episodes.every((place) => {
        const aired = airedOf(place);

        return aired === null || aired <= madeAt;
      }),
  );
  const said = reduceTitle(releaseTitle);
  const titled = couldBe.filter((reading) => {
    const [place] = reading.episodes;
    const title =
      reading.episodes.length !== 1 || place === undefined
        ? ''
        : reduceTitle(
            items.find((item) => item.season === place.season && item.episode === place.episode)
              ?.title ?? '',
          );

    return title.length > 3 && said.includes(title);
  });
  const settled = titled.length === 1 ? titled : couldBe;
  const [left] = settled;

  if (settled.length === 1 && left !== undefined) {
    return holding(left, left.numbering);
  }

  if (settled.length === 0) {
    return { kind: 'none' };
  }

  const guess =
    named !== null || (parsed.seasons.length > 0 && !/\bS\d{1,2} ?E\d/i.test(releaseTitle))
      ? 'perCour'
      : parsed.seasons.length > 0
        ? 'aired'
        : 'absolute';

  return {
    kind: 'ambiguous',
    readings: settled,
    guess: settled.some((reading) => reading.numbering === guess)
      ? guess
      : (left?.numbering ?? guess),
  };
};

export type { AnimeMatch, Reading };

export { matchAnimeRelease };
