import { and, eq, gte, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { favourite, mediaItem, rating, watchHistory } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { ArtworkAddressOf } from '@ValenceServer/images/ArtworkAddressOf';
import { readGenres } from '@ValenceServer/library/readGenres';
import { readSummaries } from '@ValenceServer/library/readSummaries';
import type { LikenessIndex } from '@ValenceServer/likeness/indexLikeness';
import { titleKey } from '@ValenceServer/likeness/titleKey';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { rankForYou } from './rankForYou';
import type { TitleHistory } from './TitleHistory';
import type { TitleTraits } from './TitleTraits';
import { vectorsOfTitles } from './vectorsOfTitles';
import type { Viewing } from './Viewing';
import { weightOfHistory } from './weightOfHistory';

type ReadPickedForYouOptions = {
  db: AnyValenceDatabase;
  viewer: Viewer;
  index: LikenessIndex;
  limit: number;
  artworkAddressOf?: ArtworkAddressOf;
};

const WATCHED_ENOUGH_SECONDS = 20 * 60;

const DAY_MS = 24 * 60 * 60 * 1000;

const VIEWINGS_READ = 2000;

const HOUSEHOLD_VIEWINGS_READ = 100_000;

/**
 * Reads the titles a profile is likely to enjoy next, learnt from its own viewing, stars and
 * favourites, from what the rest of the household watched, and from what the catalogue says each
 * title is like, among the films and programmes it may see and has not started.
 *
 * @param options - The database, who is asking, what the catalogue says each title is like, how
 *   many to take, and where pictures are served by name.
 * @returns The titles, best first, a programme by its first episode.
 */
const readPickedForYou = async ({
  db,
  viewer,
  index,
  limit,
  artworkAddressOf,
}: ReadPickedForYouOptions): Promise<MediaSummary[]> => {
  if (viewer.kind !== 'account' || viewer.profileId === null) {
    return [];
  }

  const { profileId } = viewer;
  const reachable = and(
    isNull(mediaItem.extraKind),
    isNull(mediaItem.parentId),
    isNotATrack(db),
    visibleToViewer(db, viewer),
  );
  const films = await db
    .select({
      id: mediaItem.id,
      externalId: mediaItem.externalId,
      genres: mediaItem.genres,
      rating: mediaItem.rating,
    })
    .from(mediaItem)
    .where(and(reachable, isNull(mediaItem.seriesTitle)));
  const firstEpisodes = await db
    .select({ id: sql<string>`min(${mediaItem.id})` })
    .from(mediaItem)
    .where(and(reachable, isNotNull(mediaItem.seriesId)))
    .groupBy(mediaItem.seriesId);
  const shows =
    firstEpisodes.length === 0
      ? []
      : await db
          .select({
            seriesId: mediaItem.seriesId,
            externalId: mediaItem.externalId,
            genres: mediaItem.genres,
            rating: mediaItem.rating,
          })
          .from(mediaItem)
          .where(
            inArray(
              mediaItem.id,
              firstEpisodes.map((one) => one.id),
            ),
          );

  const traits = new Map<string, TitleTraits>();
  const ratings = new Map<string, number | null>();
  const idOfKey = new Map<string, string>();

  const learn = (
    id: string,
    kind: 'film' | 'series',
    row: Pick<typeof mediaItem.$inferSelect, 'externalId' | 'genres' | 'rating'>,
  ) => {
    const key = row.externalId === null ? null : titleKey(kind, row.externalId);
    const known = key === null ? undefined : index.titles.get(key);

    if (key !== null) {
      idOfKey.set(key, id);
    }

    traits.set(id, {
      genres: readGenres(JsonValueSchema.parse(row.genres ?? null)) ?? [],
      keywords: [...(known?.keywords ?? [])],
      cast: [...(known?.cast ?? [])],
      crew: [...(known?.crew ?? [])],
    });
    ratings.set(id, row.rating);
  };

  for (const film of films) {
    learn(film.id, 'film', film);
  }

  for (const show of shows) {
    if (show.seriesId !== null) {
      learn(show.seriesId, 'series', show);
    }
  }

  const titleOf = (row: { id: string; parentId: string | null; seriesId: string | null }) =>
    row.seriesId ?? row.parentId ?? row.id;
  const now = Date.now();
  const viewings = await db
    .select({
      id: mediaItem.id,
      parentId: mediaItem.parentId,
      seriesId: mediaItem.seriesId,
      externalId: mediaItem.externalId,
      secondsWatched: watchHistory.secondsWatched,
      durationSeconds: mediaItem.durationSeconds,
      isFinished: watchHistory.isFinished,
      lastWatchedAt: watchHistory.lastWatchedAt,
    })
    .from(watchHistory)
    .innerJoin(mediaItem, eq(mediaItem.id, watchHistory.mediaItemId))
    .where(and(eq(watchHistory.profileId, profileId), isNull(mediaItem.extraKind)))
    .limit(VIEWINGS_READ);
  const stars = await db
    .select({ mediaId: rating.mediaItemId, seriesId: rating.seriesId, stars: rating.stars })
    .from(rating)
    .where(eq(rating.profileId, profileId));
  const kept = await db
    .select({ id: mediaItem.id, parentId: mediaItem.parentId, seriesId: mediaItem.seriesId })
    .from(favourite)
    .innerJoin(mediaItem, eq(mediaItem.id, favourite.mediaItemId))
    .where(eq(favourite.profileId, profileId));

  const histories = new Map<string, { isSeries: boolean; viewings: Viewing[] }>();

  for (const viewing of viewings) {
    const id = titleOf(viewing);
    const held = histories.get(id) ?? { isSeries: viewing.seriesId !== null, viewings: [] };

    held.viewings.push({
      secondsWatched: viewing.secondsWatched,
      durationSeconds: viewing.durationSeconds,
      isFinished: viewing.isFinished,
      daysAgo: Math.max(0, (now - viewing.lastWatchedAt.getTime()) / DAY_MS),
    });
    histories.set(id, held);
  }

  const starsOf = new Map(
    stars.flatMap((one) => {
      const id = one.seriesId ?? one.mediaId;

      return id === null ? [] : [[id, one.stars] as const];
    }),
  );
  const keptIds = new Set(kept.map(titleOf));
  const weights = new Map<string, number>();

  for (const id of new Set([...histories.keys(), ...starsOf.keys(), ...keptIds])) {
    const history: TitleHistory = {
      isSeries: histories.get(id)?.isSeries ?? false,
      viewings: histories.get(id)?.viewings ?? [],
      stars: starsOf.get(id) ?? null,
      isFavourite: keptIds.has(id),
    };

    weights.set(id, weightOfHistory(history));
  }

  const household = await db
    .selectDistinct({
      profileId: watchHistory.profileId,
      id: mediaItem.id,
      parentId: mediaItem.parentId,
      seriesId: mediaItem.seriesId,
    })
    .from(watchHistory)
    .innerJoin(mediaItem, eq(mediaItem.id, watchHistory.mediaItemId))
    .where(
      and(
        isNull(mediaItem.extraKind),
        or(
          eq(watchHistory.isFinished, true),
          gte(watchHistory.secondsWatched, WATCHED_ENOUGH_SECONDS),
        ),
      ),
    )
    .limit(HOUSEHOLD_VIEWINGS_READ);
  const watchers = new Map<string, Set<string>>();

  for (const one of household) {
    const id = titleOf(one);
    const held = watchers.get(id) ?? new Set<string>();

    held.add(one.profileId);
    watchers.set(id, held);
  }

  const recommended = new Map<string, number>();
  const keyOfId = new Map([...idOfKey].map(([key, id]) => [id, key]));

  for (const [id, weight] of weights) {
    const key = keyOfId.get(id);
    const known = key === undefined ? undefined : index.titles.get(key);

    if (known === undefined || weight <= 0) {
      continue;
    }

    for (const catalogueId of known.likeness.recommendations) {
      const other = idOfKey.get(titleKey(known.kind, catalogueId.toString()));

      if (other !== undefined) {
        recommended.set(other, Math.min(1, (recommended.get(other) ?? 0) + weight));
      }
    }
  }

  const ranked = rankForYou({
    vectors: vectorsOfTitles(traits),
    weights,
    watchers,
    profileId,
    recommended,
    ratings,
    leaveOut: new Set([...histories.keys(), ...keptIds]),
    limit,
  });
  const cards = await readSummaries(db, viewer, ranked, artworkAddressOf);

  return ranked.flatMap((id) => {
    const card = cards.get(id);

    return card === undefined ? [] : [card];
  });
};

export type { ReadPickedForYouOptions };

export { readPickedForYou };
