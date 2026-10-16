/* oxlint-disable valence/no-hard-coded-strings -- AniList's own format names and the cour orders a request stores, matched rather than shown */
import type { AniListEntry } from '@ValenceServer/requests/anilist/AniListEntry';
import type { EpisodeGroup } from '@ValenceServer/requests/anime/EpisodeGroup';
import type {
  AnimeCour,
  AnimeEpisode,
  AnimeFacts,
  CourOrder,
  CourSource,
} from '@ValenceContracts/schemas/Anime';
import type { CatalogueEpisode } from '@ValenceContracts/schemas/MediaRequest';

type Range = { start: number; count: number; name: string | null };

const SERIES_FORMATS = new Set(['TV', 'TV_SHORT', 'ONA']);

const DAYS_APART = 2;

const DAY_MS = 86_400_000;

const ABSOLUTE = 2;

const MOST_NAMES = 20;

/**
 * How many days lie between two calendar dates.
 *
 * @param left - One date.
 * @param right - The other.
 * @returns The days between them, either way round.
 */
const daysBetween = (left: string, right: string): number =>
  Math.abs(Date.parse(`${left}T00:00:00Z`) - Date.parse(`${right}T00:00:00Z`)) / DAY_MS;

/**
 * Where each of AniList's entries begins among a show's regular episodes in the order they aired:
 * the episode that aired within a couple of days of the entry's first, since Japan's day is often
 * the catalogue's day before. An entry that begins nowhere among them is left out, and where two
 * begin at the same episode the closer match AniList gave first is kept.
 *
 * @param entries - AniList's entries for the show, its series only.
 * @param regular - The show's regular episodes, in the order they aired.
 * @returns Each entry kept and where it begins, in the order they aired.
 */
const anchorsOf = (
  entries: readonly AniListEntry[],
  regular: readonly CatalogueEpisode[],
): { entry: AniListEntry; start: number }[] => {
  const anchored = entries.flatMap((entry) => {
    const begins = entry.startDate;

    if (begins === null) {
      return [];
    }

    const start = regular.findIndex(
      (episode) => episode.airDate !== null && daysBetween(episode.airDate, begins) <= DAYS_APART,
    );

    return start === -1 ? [] : [{ entry, start }];
  });

  return anchored
    .filter((one, at) => anchored.findIndex((other) => other.start === one.start) === at)
    .toSorted((left, right) => left.start - right.start);
};

/**
 * Whether a way of dividing a show's episodes lines up with AniList's entries: each part begins
 * where an entry does, every entry begins where a part does, and each part holds as many episodes
 * as its entry has, unless the entry is still airing.
 *
 * @param ranges - The parts, in order.
 * @param anchors - Where each entry begins.
 * @returns Whether they agree.
 */
const linesUp = (
  ranges: readonly Range[],
  anchors: readonly { entry: AniListEntry; start: number }[],
): boolean =>
  anchors.length > 0 &&
  ranges.length === anchors.length &&
  ranges.every((range, at) => {
    const anchor = anchors[at];

    return (
      anchor !== undefined &&
      anchor.start === range.start &&
      (anchor.entry.episodes === null ||
        anchor.entry.isAiring ||
        anchor.entry.episodes === range.count)
    );
  });

/**
 * A show's regular episodes divided by the catalogue's seasons.
 *
 * @param regular - The regular episodes, in the order they aired.
 * @returns One part per season.
 */
const seasonRanges = (regular: readonly CatalogueEpisode[]): Range[] =>
  [...new Set(regular.map((episode) => episode.season))].map((season) => ({
    start: regular.findIndex((episode) => episode.season === season),
    count: regular.filter((episode) => episode.season === season).length,
    name: null,
  }));

/**
 * A show's regular episodes divided by one of the catalogue's episode groups, where the group
 * holds every regular episode once and each of its parts is a run of episodes in the order they
 * aired; nothing where it does not, whatever it calls itself.
 *
 * @param group - The episode group.
 * @param regular - The regular episodes, in the order they aired.
 * @returns Its parts, or null where it cannot be trusted.
 */
const groupRanges = (group: EpisodeGroup, regular: readonly CatalogueEpisode[]): Range[] | null => {
  const indexOf = (season: number, episode: number) =>
    regular.findIndex((one) => one.season === season && one.episode === episode);
  const parts = group.groups
    .map((part) => ({
      name: part.name.trim() === '' ? null : part.name.trim(),
      at: part.episodes
        .filter((one) => one.season > 0)
        .map((one) => indexOf(one.season, one.episode)),
    }))
    .filter((part) => part.at.length > 0);
  const every = parts.flatMap((part) => part.at);

  if (
    every.includes(-1) ||
    every.length !== regular.length ||
    new Set(every).size !== every.length ||
    parts.some((part) => {
      const sorted = part.at.toSorted((left, right) => left - right);

      return sorted.some((at, place) => place > 0 && at !== (sorted[place - 1] ?? 0) + 1);
    })
  ) {
    return null;
  }

  return parts
    .map((part) => ({ start: Math.min(...part.at), count: part.at.length, name: part.name }))
    .toSorted((left, right) => left.start - right.start);
};

/**
 * A show's regular episodes divided by AniList's entries, each beginning where its entry does;
 * anything that aired before the first is a part of its own.
 *
 * @param anchors - Where each entry begins.
 * @param total - How many regular episodes there are.
 * @returns One part per entry.
 */
const aniListRanges = (
  anchors: readonly { entry: AniListEntry; start: number }[],
  total: number,
): Range[] => {
  const starts = [...new Set([0, ...anchors.map((anchor) => anchor.start)])];

  return starts.map((start, at) => ({
    start,
    count: (starts[at + 1] ?? total) - start,
    name: null,
  }));
};

/**
 * Every name an AniList entry goes by, its English first, without repeats.
 *
 * @param entry - The entry.
 * @returns Its names.
 */
const namesOf = (entry: AniListEntry | undefined): string[] =>
  entry === undefined
    ? []
    : [
        ...new Set(
          [entry.english, entry.romaji, entry.native, ...entry.synonyms].filter(
            (name): name is string => name !== null && name.trim() !== '',
          ),
        ),
      ].slice(0, MOST_NAMES);

/**
 * Every regular episode's number counted from the show's very first: from a catalogue episode group
 * that numbers them so and holds every one, and otherwise in the order they aired.
 *
 * @param groups - The catalogue's episode groups.
 * @param regular - The regular episodes, in the order they aired.
 * @returns Each episode's number, by where it is in the order they aired.
 */
const absolutesOf = (
  groups: readonly EpisodeGroup[],
  regular: readonly CatalogueEpisode[],
): number[] => {
  const counted = groups
    .filter((group) => group.type === ABSOLUTE && groupRanges(group, regular) !== null)
    .map((group) =>
      group.groups
        .flatMap((part) => part.episodes)
        .filter((one) => one.season > 0)
        .map((one) =>
          regular.findIndex(
            (other) => other.season === one.season && other.episode === one.episode,
          ),
        ),
    )[0];

  if (counted === undefined) {
    return regular.map((_episode, at) => at + 1);
  }

  const numbers = Array.from({ length: regular.length }, () => 0);

  counted.forEach((at, place) => {
    numbers[at] = place + 1;
  });

  return numbers;
};

/**
 * What an anime request knows of a show beyond the catalogue: its cours, its names in English,
 * romaji and Japanese, its AniList and MyAnimeList ids, and each episode's number counted from the
 * first.
 *
 * Cours are the catalogue's seasons where they line up with AniList's entries by when each began
 * and how many episodes it has; otherwise the first of the catalogue's episode groups that holds
 * every regular episode once and lines up the same way, whatever the group calls itself; otherwise
 * AniList's entries, each beginning where it first aired, rather than following AniList's sequels,
 * which wander into other shows. With nothing from AniList they are the catalogue's seasons. An
 * operator's choice of seasons, AniList or a particular episode group overrides all of that, where
 * the group they chose can be trusted.
 *
 * @param episodes - The catalogue's episodes, Specials among them.
 * @param entries - AniList's entries found for the show.
 * @param groups - The catalogue's episode groups for the show, read whole.
 * @param order - How the operator asked for its cours to be worked out.
 * @returns What the request keeps.
 */
const animeFactsOf = (
  episodes: readonly CatalogueEpisode[],
  entries: readonly AniListEntry[],
  groups: readonly EpisodeGroup[],
  order: CourOrder = 'auto',
): AnimeFacts => {
  const regular = episodes
    .filter((episode) => episode.season > 0)
    .toSorted((left, right) => left.season - right.season || left.episode - right.episode);
  const anchors = anchorsOf(
    entries.filter((entry) => SERIES_FORMATS.has(entry.format ?? '')),
    regular,
  );
  const bySeason = seasonRanges(regular);
  const trusted = groups.flatMap((group) => {
    const ranges = groupRanges(group, regular);

    return ranges === null ? [] : [{ group, ranges }];
  });
  const chosenGroup = order.startsWith('group:')
    ? trusted.find(({ group }) => `group:${group.id}` === order)
    : undefined;
  const linedUpGroup = trusted.find(({ ranges }) => linesUp(ranges, anchors));
  const picked: { source: CourSource; ranges: Range[]; groupId: string | null } =
    chosenGroup !== undefined
      ? { source: 'group', ranges: chosenGroup.ranges, groupId: chosenGroup.group.id }
      : order === 'seasons' || anchors.length === 0
        ? { source: 'seasons', ranges: bySeason, groupId: null }
        : order === 'anilist'
          ? { source: 'anilist', ranges: aniListRanges(anchors, regular.length), groupId: null }
          : linesUp(bySeason, anchors)
            ? { source: 'seasons', ranges: bySeason, groupId: null }
            : linedUpGroup !== undefined
              ? { source: 'group', ranges: linedUpGroup.ranges, groupId: linedUpGroup.group.id }
              : {
                  source: 'anilist',
                  ranges: aniListRanges(anchors, regular.length),
                  groupId: null,
                };
  const absolutes = absolutesOf(groups, regular);
  const courAt = (at: number) =>
    picked.ranges.findIndex((range) => at >= range.start && at < range.start + range.count) + 1;
  const cours: AnimeCour[] = picked.ranges.map((range, at) => {
    const entry = anchors.find((anchor) => anchor.start === range.start)?.entry;
    const inIt = regular.slice(range.start, range.start + range.count);
    const seasons = [...new Set(inIt.map((episode) => episode.season))];
    const [season] = seasons;
    const names = namesOf(entry);

    return {
      cour: at + 1,
      name: names[0] ?? range.name,
      names,
      anilistId: entry?.id ?? null,
      malId: entry?.malId ?? null,
      season:
        seasons.length === 1 &&
        season !== undefined &&
        regular.filter((episode) => episode.season === season).length === inIt.length
          ? season
          : null,
      firstAired: inIt[0]?.airDate ?? null,
      episodeCount: inIt.length,
    };
  });
  const placed: AnimeEpisode[] = episodes.map((episode) => {
    const at = regular.findIndex(
      (one) => one.season === episode.season && one.episode === episode.episode,
    );

    return {
      season: episode.season,
      episode: episode.episode,
      absolute: at === -1 ? null : (absolutes[at] ?? at + 1),
      cour: at === -1 ? 0 : courAt(at),
    };
  });
  const first = anchors[0]?.entry;

  return {
    anilistId: first?.id ?? null,
    malId: first?.malId ?? null,
    names: {
      english: first?.english ?? null,
      romaji: first?.romaji ?? null,
      native: first?.native ?? null,
      others: (first?.synonyms ?? []).slice(0, MOST_NAMES),
    },
    cours,
    episodes: placed,
    courSource: picked.source,
    groupId: picked.groupId,
    groups: trusted.map(({ group }) => ({
      id: group.id,
      name: group.name,
      groupCount: group.groups.length,
    })),
    films: entries
      .filter((entry) => entry.format === 'MOVIE')
      .map((entry) => ({
        anilistId: entry.id,
        title: entry.english ?? entry.romaji ?? entry.native ?? '',
        year: entry.startDate === null ? null : Number(entry.startDate.slice(0, 4)),
        tmdbId: null,
      }))
      .filter((film) => film.title !== ''),
  };
};

export { animeFactsOf };
