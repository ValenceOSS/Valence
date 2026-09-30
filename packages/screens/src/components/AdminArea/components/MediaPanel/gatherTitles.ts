import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaTitle } from './MediaTitle.types';
import { say } from '@ValenceI18n/say';

/**
 * Orders episodes as they are watched: by season, then by number, with anything unnumbered last.
 *
 * @param left - One episode.
 * @param right - Another.
 * @returns Which comes first.
 */
const inWatchingOrder = (left: MediaSummary, right: MediaSummary): number =>
  (left.seasonNumber ?? Number.MAX_SAFE_INTEGER) -
    (right.seasonNumber ?? Number.MAX_SAFE_INTEGER) ||
  (left.episodeNumber ?? Number.MAX_SAFE_INTEGER) -
    (right.episodeNumber ?? Number.MAX_SAFE_INTEGER) ||
  left.title.localeCompare(right.title);

/**
 * Adds up the sizes of some files, saying nothing where none of them knows its own.
 *
 * @param items - The files.
 * @returns Their total size in bytes, or null.
 */
const totalSize = (items: readonly MediaSummary[]): number | null => {
  const known = items
    .map((item) => item.sizeBytes)
    .filter((size) => size !== null && size !== undefined);

  return known.length === 0 ? null : known.reduce((sum, size) => sum + size, 0);
};

/**
 * Pads a number so that numbers compare in order as text.
 *
 * @param value - The number, or null to sort last.
 * @returns It as text that sorts in number order.
 */
const inOrder = (value: number | null | undefined): string =>
  (value ?? 99_999).toString().padStart(5, '0');

/**
 * One edition of a film or an episode as a row beneath it: the file itself first, then its other
 * versions by name.
 *
 * @param edition - The edition's file.
 * @param at - Where it comes among the editions.
 * @returns Its row.
 */
const editionRow = (edition: MediaSummary, at: number): MediaTitle => ({
  id: `edition ${edition.id}`,
  libraryId: edition.libraryId,
  kind: 'version',
  name: edition.versionLabel ?? say('common.original'),
  order: inOrder(at),
  year: null,
  lead: edition,
  episodes: [edition],
  parts: [],
  seasons: 0,
  sizeBytes: edition.sizeBytes ?? null,
  addedAt: edition.addedAt,
  posterFrom: null,
  isMatched: true,
});

/**
 * An episode as a row beneath its series or season, opening onto its editions where there is more
 * than one file of it.
 *
 * @param episode - The episode.
 * @param others - Its other versions.
 * @returns Its row.
 */
const episodeRow = (episode: MediaSummary, others: readonly MediaSummary[] = []): MediaTitle => {
  const editions = others.length === 0 ? [] : [episode, ...others];

  return {
    id: episode.id,
    libraryId: episode.libraryId,
    kind: 'episode',
    name: episode.title,
    order: `${inOrder(episode.seasonNumber)}${inOrder(episode.episodeNumber)}`,
    year: null,
    lead: episode,
    episodes: [episode],
    parts: editions.map(editionRow),
    seasons: 0,
    sizeBytes: editions.length === 0 ? (episode.sizeBytes ?? null) : totalSize(editions),
    addedAt: episode.addedAt,
    posterFrom: null,
    isMatched: true,
  };
};

/**
 * Names a season as a row says it.
 *
 * @param season - Its number, or null where the files do not say.
 * @returns What to call it.
 */
const nameOfSeason = (season: number | null): string =>
  season === null
    ? say('screens.mediaPanel.gatherTitles.noSeason')
    : season === 0
      ? say('common.specials')
      : say('screens.mediaPanel.gatherTitles.seasonSeason', { season: season.toString() });

/**
 * Where a season sorts among the others: numbered seasons in order, then the specials, then
 * anything the files did not number.
 *
 * @param season - Its number, or null.
 * @returns Its place as text that sorts in order.
 */
const placeOfSeason = (season: number | null): string =>
  season === 0 ? inOrder(99_998) : inOrder(season);

/**
 * The rows beneath a series: its seasons, each holding its episodes, or the episodes themselves
 * where there is only the one season, since a row that opens onto a single row is a press for
 * nothing.
 *
 * @param seriesKey - What the series is known by, to keep its seasons' ids its own.
 * @param episodes - Its episodes, in the order they are watched.
 * @param versionsOf - Each episode's other versions, by the episode.
 * @returns The rows.
 */
const partsOf = (
  seriesKey: string,
  episodes: readonly MediaSummary[],
  versionsOf: ReadonlyMap<string, MediaSummary[]>,
): MediaTitle[] => {
  const rowOf = (episode: MediaSummary): MediaTitle =>
    episodeRow(episode, versionsOf.get(episode.id) ?? []);

  const seasons = new Map<number | null, MediaSummary[]>();

  for (const episode of episodes) {
    const season = episode.seasonNumber ?? null;

    seasons.set(season, [...(seasons.get(season) ?? []), episode]);
  }

  if (seasons.size < 2) {
    return episodes.map(rowOf);
  }

  return [...seasons.entries()]
    .sort(([left], [right]) => placeOfSeason(left).localeCompare(placeOfSeason(right)))
    .flatMap(([season, inSeason]) => {
      const lead = inSeason[0];

      return lead === undefined
        ? []
        : [
            {
              id: `season ${seriesKey} ${String(season)}`,
              libraryId: lead.libraryId,
              kind: 'season' as const,
              name: nameOfSeason(season),
              order: placeOfSeason(season),
              year: null,
              lead,
              episodes: inSeason,
              parts: inSeason.map(rowOf),
              seasons: 1,
              sizeBytes: totalSize(
                inSeason.flatMap((episode) => [episode, ...(versionsOf.get(episode.id) ?? [])]),
              ),
              addedAt:
                inSeason
                  .map((episode) => episode.addedAt)
                  .sort()
                  .at(-1) ?? lead.addedAt,
              posterFrom: null,
              isMatched: true,
            },
          ];
    });
};

/**
 * Turns every file the libraries hold into the titles a person thinks in: each film once, carrying
 * its other versions as editions, and each series once, carrying every episode on the disk in the
 * order they are watched. A film or series is sized and dated by all of its files rather than by
 * whichever happened to come first.
 *
 * @param items - Every file, as the libraries list them.
 * @returns One title per film and per series.
 */
const gatherTitles = (items: readonly MediaSummary[]): MediaTitle[] => {
  const series = new Map<string, MediaSummary[]>();
  const films: MediaTitle[] = [];
  const held = new Set(items.map((item) => item.id));
  const versionsOf = new Map<string, MediaSummary[]>();

  for (const item of items) {
    const parentId = item.parentId ?? null;

    if (parentId !== null && held.has(parentId)) {
      versionsOf.set(parentId, [...(versionsOf.get(parentId) ?? []), item]);
    }
  }

  for (const item of items) {
    const seriesTitle = item.seriesTitle ?? null;

    if ((item.parentId ?? null) !== null && held.has(item.parentId ?? '')) {
      continue;
    }

    if (seriesTitle === null) {
      const others = versionsOf.get(item.id) ?? [];
      const editions = others.length === 0 ? [] : [item, ...others];

      films.push({
        id: item.id,
        libraryId: item.libraryId,
        kind: 'film',
        name: item.title,
        order: item.title.toLowerCase(),
        year: item.year,
        lead: item,
        episodes: editions,
        parts: editions.map(editionRow),
        seasons: 0,
        sizeBytes: editions.length === 0 ? (item.sizeBytes ?? null) : totalSize(editions),
        addedAt:
          [item, ...others]
            .map((one) => one.addedAt)
            .sort()
            .at(-1) ?? item.addedAt,
        posterFrom: item.hasPoster ? item.id : null,
        isMatched: item.externalId !== null && item.externalId !== undefined,
      });
      continue;
    }

    const key = `${item.libraryId} ${item.seriesId ?? seriesTitle}`;

    series.set(key, [...(series.get(key) ?? []), item]);
  }

  const shows = [...series.entries()].map(([key, unordered]): MediaTitle => {
    const episodes = [...unordered].sort(inWatchingOrder);
    const lead = episodes[0] ?? unordered[0];

    if (lead === undefined) {
      throw new Error(`A series with no episodes: ${key}`);
    }

    return {
      id: `series ${key}`,
      libraryId: lead.libraryId,
      kind: 'series',
      name: lead.seriesTitle ?? lead.title,
      order: (lead.seriesTitle ?? lead.title).toLowerCase(),
      year: episodes.map((episode) => episode.year).find((year) => year !== null) ?? null,
      lead,
      episodes,
      parts: partsOf(key, episodes, versionsOf),
      seasons: new Set(episodes.map((episode) => episode.seasonNumber ?? null)).size,
      sizeBytes: totalSize(
        episodes.flatMap((episode) => [episode, ...(versionsOf.get(episode.id) ?? [])]),
      ),
      addedAt:
        episodes
          .map((episode) => episode.addedAt)
          .sort()
          .at(-1) ?? lead.addedAt,
      posterFrom: episodes.find((episode) => episode.hasPoster)?.id ?? null,
      isMatched: episodes.some(
        (episode) => episode.externalId !== null && episode.externalId !== undefined,
      ),
    };
  });

  return [...films, ...shows].sort((left, right) => left.name.localeCompare(right.name));
};

export { gatherTitles };
