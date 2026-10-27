import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm';
import { mediaItem, rating, watchHistory } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { BecauseYouWatchedRow } from '@ValenceContracts/schemas/Likeness';
import { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import { summaryOfRow } from '@ValenceServer/library/summaryOfRow';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { LikenessStore } from './createDatabaseLikenessStore';
import { indexLikeness } from './indexLikeness';
import type { LikenessIndex } from './indexLikeness';
import type { TitleKind } from './Likeness';
import { rankLikeness } from './rankLikeness';
import type { Ranked } from './rankLikeness';
import { titleKey } from './titleKey';
import { inSeasonOrder } from '@ValenceCore/functions/inSeasonOrder';

type LikenessService = {
  likeThis: (viewer: Viewer, mediaId: string, limit: number) => Promise<MediaSummary[] | null>;
  becauseYouWatched: (
    viewer: Viewer,
    rows: number,
    limit: number,
  ) => Promise<BecauseYouWatchedRow[]>;
  forget: () => void;
};

type HeldTitle = { kind: TitleKind; catalogueId: string };

const WATCHED_ENOUGH_SECONDS = 20 * 60;

const DISLIKED_STARS = 2;

const VIEWINGS_LOOKED_AT = 200;

const FEWEST_IN_A_ROW = 4;

const HANDFULS_ASKED = 3;

const TRIES_FOR_EACH_ROW = 2;

/**
 * Reads which title a stored row is, by the catalogue's identifier and whether it is an episode.
 *
 * @param row - The row's catalogue identifier and programme title.
 * @returns The title, or null where the catalogue never named it.
 */
const heldTitleOf = (row: {
  externalId: string | null;
  seriesTitle: string | null;
}): HeldTitle | null =>
  row.externalId === null
    ? null
    : { kind: row.seriesTitle === null ? 'film' : 'series', catalogueId: row.externalId };

/**
 * Finds the titles in the libraries like another, and the rows of them a profile's recent viewing
 * suggests, from what the catalogue said each title is like. What every title is like is read once
 * and kept until it is told to forget it; what a viewer may see is asked of the database each time.
 *
 * @param options - The database, and where what each title is like is kept.
 * @param options.db - The database.
 * @param options.store - Where what each title is like is kept.
 * @returns The service.
 */
const createLikenessService = ({
  db,
  store,
}: {
  db: AnyValenceDatabase;
  store: Pick<LikenessStore, 'readAll'>;
}): LikenessService => {
  let held: Promise<LikenessIndex> | null = null;

  /**
   * Reads what every title is like, once until told to forget it.
   *
   * @returns The index.
   */
  const indexed = async (): Promise<LikenessIndex> => {
    held ??= store.readAll().then(indexLikeness);

    try {
      return await held;
    } catch (error) {
      held = null;

      throw error;
    }
  };

  /**
   * Finds the copy of each title a viewer may see that stands for it: a film itself, and a
   * programme's first episode in the order it is watched, specials after the seasons, as a shelf
   * shows one.
   *
   * @param viewer - Who is asking.
   * @param keys - The titles, by key.
   * @param index - What every title is like, which says what each key is.
   * @returns The summary standing for each title the viewer may see, by key.
   */
  const standingFor = async (
    viewer: Viewer,
    keys: readonly string[],
    index: LikenessIndex,
  ): Promise<Map<string, MediaSummary>> => {
    const titles = keys.flatMap((key) => index.titles.get(key) ?? []);
    const filmIds = titles.filter((one) => one.kind === 'film').map((one) => one.catalogueId);
    const seriesIds = titles.filter((one) => one.kind === 'series').map((one) => one.catalogueId);
    const reachable = and(
      isNull(mediaItem.extraKind),
      isNull(mediaItem.parentId),
      isNotATrack(db),
      visibleToViewer(db, viewer),
    );

    const episodes =
      seriesIds.length === 0
        ? []
        : await db
            .select({
              id: mediaItem.id,
              externalId: mediaItem.externalId,
              seasonNumber: mediaItem.seasonNumber,
              episodeNumber: mediaItem.episodeNumber,
            })
            .from(mediaItem)
            .where(
              and(
                inArray(mediaItem.externalId, seriesIds),
                isNotNull(mediaItem.seriesTitle),
                reachable,
              ),
            );
    const earliest = new Map<string, string>();
    const inWatchingOrder = episodes.toSorted(
      (left, right) =>
        inSeasonOrder(left.seasonNumber, right.seasonNumber) ||
        (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0) ||
        left.id.localeCompare(right.id),
    );

    for (const episode of inWatchingOrder) {
      if (episode.externalId !== null && !earliest.has(episode.externalId)) {
        earliest.set(episode.externalId, episode.id);
      }
    }

    const asked = [
      ...(filmIds.length === 0
        ? []
        : [and(inArray(mediaItem.externalId, filmIds), isNull(mediaItem.seriesTitle))]),
      ...(earliest.size === 0 ? [] : [inArray(mediaItem.id, [...earliest.values()])]),
    ];

    if (asked.length === 0) {
      return new Map();
    }

    const rows = await db
      .select(SUMMARY_COLUMNS)
      .from(mediaItem)
      .where(and(or(...asked), reachable))
      .orderBy(asc(mediaItem.addedAt), asc(mediaItem.id));
    const standing = new Map<string, MediaSummary>();

    for (const row of rows) {
      const title = heldTitleOf(row);
      const key = title === null ? null : titleKey(title.kind, title.catalogueId);

      if (key !== null && !standing.has(key)) {
        standing.set(key, summaryOfRow(row));
      }
    }

    return standing;
  };

  /**
   * Takes ranked titles in order until enough of them are ones the viewer may see, asking after a
   * handful at a time so that a viewer kept from many of the best still gets a full row, and giving
   * up after a few handfuls rather than reading the whole ranking for one that is kept from most.
   *
   * @param viewer - Who is asking.
   * @param ranked - The titles, most alike first.
   * @param limit - How many to take.
   * @param index - What every title is like.
   * @returns The summaries, most alike first.
   */
  const firstVisible = async (
    viewer: Viewer,
    ranked: readonly Ranked[],
    limit: number,
    index: LikenessIndex,
  ): Promise<{ key: string; summary: MediaSummary }[]> => {
    const taken: { key: string; summary: MediaSummary }[] = [];

    for (
      let at = 0;
      at < ranked.length && at < limit * 2 * HANDFULS_ASKED && taken.length < limit;
      at += limit * 2
    ) {
      const keys = ranked.slice(at, at + limit * 2).map((one) => one.key);
      const standing = await standingFor(viewer, keys, index);

      for (const key of keys) {
        const summary = standing.get(key);

        if (summary !== undefined && taken.length < limit) {
          taken.push({ key, summary });
        }
      }
    }

    return taken;
  };

  return {
    likeThis: async (viewer, mediaId, limit) => {
      const [source] = await db
        .select({ externalId: mediaItem.externalId, seriesTitle: mediaItem.seriesTitle })
        .from(mediaItem)
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      if (source === undefined) {
        return null;
      }

      const title = heldTitleOf(source);

      if (title === null) {
        return [];
      }

      const index = await indexed();
      const ranked = rankLikeness(index, titleKey(title.kind, title.catalogueId));

      return (await firstVisible(viewer, ranked, limit, index)).map((one) => one.summary);
    },

    becauseYouWatched: async (viewer, rows, limit) => {
      if (viewer.kind !== 'account' || viewer.profileId === null) {
        return [];
      }

      const { profileId } = viewer;
      const viewings = await db
        .select({
          mediaId: mediaItem.id,
          title: mediaItem.title,
          seriesId: mediaItem.seriesId,
          seriesTitle: mediaItem.seriesTitle,
          externalId: mediaItem.externalId,
        })
        .from(watchHistory)
        .innerJoin(mediaItem, eq(mediaItem.id, watchHistory.mediaItemId))
        .where(
          and(
            eq(watchHistory.profileId, profileId),
            isNotNull(mediaItem.externalId),
            isNull(mediaItem.extraKind),
            or(
              eq(watchHistory.isFinished, true),
              gte(watchHistory.secondsWatched, WATCHED_ENOUGH_SECONDS),
            ),
            visibleToViewer(db, viewer, { includesStreamed: true }),
          ),
        )
        .orderBy(desc(watchHistory.lastWatchedAt))
        .limit(VIEWINGS_LOOKED_AT);
      const seenRows = await db
        .selectDistinct({ externalId: mediaItem.externalId, seriesTitle: mediaItem.seriesTitle })
        .from(watchHistory)
        .innerJoin(mediaItem, eq(mediaItem.id, watchHistory.mediaItemId))
        .where(
          and(
            eq(watchHistory.profileId, profileId),
            isNotNull(mediaItem.externalId),
            isNull(mediaItem.extraKind),
          ),
        );
      const disliked = await db
        .select({ mediaId: rating.mediaItemId, seriesId: rating.seriesId })
        .from(rating)
        .where(and(eq(rating.profileId, profileId), lte(rating.stars, DISLIKED_STARS)));
      const dislikedIds = new Set(
        disliked.flatMap((one) => [one.mediaId, one.seriesId].filter((id) => id !== null)),
      );
      const shown = new Set(
        seenRows.flatMap((row) => {
          const title = heldTitleOf(row);

          return title === null ? [] : [titleKey(title.kind, title.catalogueId)];
        }),
      );
      const index = await indexed();
      const answered: BecauseYouWatchedRow[] = [];
      const asked = new Set<string>();

      for (const viewing of viewings) {
        if (answered.length >= rows || asked.size >= rows * TRIES_FOR_EACH_ROW) {
          break;
        }

        const title = heldTitleOf(viewing);
        const key = title === null ? null : titleKey(title.kind, title.catalogueId);

        if (
          key === null ||
          asked.has(key) ||
          !index.titles.has(key) ||
          dislikedIds.has(viewing.mediaId) ||
          (viewing.seriesId !== null && dislikedIds.has(viewing.seriesId))
        ) {
          continue;
        }

        asked.add(key);

        const taken = await firstVisible(viewer, rankLikeness(index, key, shown), limit, index);

        if (taken.length < FEWEST_IN_A_ROW) {
          continue;
        }

        for (const one of taken) {
          shown.add(one.key);
        }

        answered.push({
          watched: {
            title: viewing.seriesTitle ?? viewing.title,
            mediaId: viewing.mediaId,
            seriesId: viewing.seriesId,
          },
          items: taken.map((one) => one.summary),
        });
      }

      return answered;
    },

    forget: () => {
      held = null;
    },
  };
};

export type { LikenessService };

export { FEWEST_IN_A_ROW, WATCHED_ENOUGH_SECONDS, createLikenessService };
