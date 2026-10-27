import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  max,
  min,
  or,
  sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import { qualified } from '@ValenceDatabase/qualified';
import { library, mediaItem, rating, series, watchProgress } from '#dialect/Schema';
import { MOST_SMART_ENTRIES } from '@ValenceContracts/schemas/SmartRules';
import { yourStars } from '@ValenceServer/library/yourStars';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import { daysBefore } from './daysBefore';
import { hasAnyGenre } from './hasAnyGenre';
import { shuffledBy } from './shuffledBy';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  TitleOrder,
  TitleRule,
  TitleRules,
  WatchedState,
} from '@ValenceContracts/schemas/SmartRules';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type SmartTitle = {
  kind: 'film' | 'series';
  id: string;
  addedAt: Date;
};

type TitlesAsked = {
  listId: string;
  viewer: Viewer;
  profileId: string | null;
  rules: TitleRules;
  now: Date;
};

/**
 * The films, or the programmes, a smart collection holds: everything of that kind the viewer may see
 * that keeps all of its rules, in its order and up to its limit, with what a rule asks of somebody
 * asked of the profile given and a programme judged by its episodes.
 *
 * @param db - The database.
 * @param asked - The collection, who is looking, whose viewing the rules read and when it is.
 * @returns The titles, in order.
 */
const titlesMatching = async (
  db: AnyValenceDatabase,
  { listId, viewer, profileId, rules, now }: TitlesAsked,
): Promise<SmartTitle[]> => {
  const theirs = profileId ?? '';
  const limit = rules.limit ?? MOST_SMART_ENTRIES;
  const seen = and(visibleToViewer(db, viewer), librariesVisibleToViewer(db, viewer));
  const progress = and(
    eq(watchProgress.mediaItemId, mediaItem.id),
    eq(watchProgress.profileId, theirs),
  );

  const filmWatched = (state: WatchedState): SQL | undefined => {
    switch (state) {
      case 'unwatched':
        return isNull(watchProgress.id);
      case 'inProgress':
        return and(isNotNull(watchProgress.id), eq(watchProgress.isFinished, false));
      case 'finished':
        return eq(watchProgress.isFinished, true);
      case 'notFinished':
        return or(isNull(watchProgress.id), eq(watchProgress.isFinished, false));
    }
  };

  const filmCondition = (rule: TitleRule): SQL | undefined => {
    switch (rule.kind) {
      case 'genre':
        return hasAnyGenre(mediaItem.genres, rule.anyOf, rule.isNegated);
      case 'released':
        return and(
          rule.from === null ? undefined : gte(mediaItem.year, rule.from),
          rule.to === null ? undefined : lte(mediaItem.year, rule.to),
        );
      case 'runtime':
        return and(
          rule.atLeastMinutes === null
            ? undefined
            : gte(mediaItem.durationSeconds, rule.atLeastMinutes * 60),
          rule.atMostMinutes === null
            ? undefined
            : lte(mediaItem.durationSeconds, rule.atMostMinutes * 60),
        );
      case 'watched':
        return filmWatched(rule.state);
      case 'rating':
        return gte(mediaItem.rating, rule.atLeast);
      case 'yourStars':
        return gte(yourStars(theirs), rule.atLeast);
      case 'added':
        return gte(mediaItem.addedAt, daysBefore(now, rule.withinDays));
      case 'library':
        return inArray(mediaItem.libraryId, [...rule.anyOf]);
      case 'ageRating':
        return lte(mediaItem.certificationAge, rule.atMost);
    }
  };

  const seriesStars = sql<
    number | null
  >`(select ${qualified(rating.stars)} from ${rating} where ${qualified(rating.seriesId)} = ${qualified(series.id)} and ${qualified(rating.profileId)} = ${theirs} limit 1)`;
  const isRegular = sql`coalesce(${mediaItem.seasonNumber}, 1) <> 0`;
  const episodes = sql<number>`sum(case when ${isRegular} then 1 else 0 end)`;
  const started = sql<number>`sum(case when ${isRegular} and ${watchProgress.id} is not null then 1 else 0 end)`;
  const finished = sql<number>`sum(case when ${isRegular} and ${watchProgress.isFinished} then 1 else 0 end)`;
  const anyEpisode = (condition: SQL): SQL =>
    sql`max(case when ${condition} then 1 else 0 end) = 1`;

  const seriesWatched = (state: WatchedState): SQL | undefined => {
    switch (state) {
      case 'unwatched':
        return eq(started, 0);
      case 'inProgress':
        return and(gt(started, 0), lt(finished, episodes));
      case 'finished':
        return and(gt(episodes, 0), eq(finished, episodes));
      case 'notFinished':
        return lt(finished, episodes);
    }
  };

  const seriesCondition = (rule: TitleRule): SQL | undefined => {
    switch (rule.kind) {
      case 'genre':
        return rule.isNegated
          ? sql`not (${anyEpisode(hasAnyGenre(mediaItem.genres, rule.anyOf, false))})`
          : anyEpisode(hasAnyGenre(mediaItem.genres, rule.anyOf, false));
      case 'released':
        return and(
          rule.from === null ? undefined : gte(min(mediaItem.year), rule.from),
          rule.to === null ? undefined : lte(min(mediaItem.year), rule.to),
        );
      case 'runtime':
        return sql`false`;
      case 'watched':
        return seriesWatched(rule.state);
      case 'rating':
        return gte(max(mediaItem.rating), rule.atLeast);
      case 'yourStars':
        return gte(seriesStars, rule.atLeast);
      case 'added':
        return gte(
          max(mediaItem.addedAt),
          sql.param(daysBefore(now, rule.withinDays), mediaItem.addedAt),
        );
      case 'library':
        return anyEpisode(inArray(mediaItem.libraryId, [...rule.anyOf]));
      case 'ageRating':
        return lte(max(mediaItem.certificationAge), rule.atMost);
    }
  };

  const filmOrder = (order: TitleOrder): SQL[] => {
    switch (order) {
      case 'random':
        return [asc(shuffledBy(mediaItem.id, listId, now))];
      case 'added':
        return [desc(mediaItem.addedAt)];
      case 'released':
        return [nullsLast(mediaItem.year, 'desc')];
      case 'title':
        return [];
      case 'rating':
        return [nullsLast(mediaItem.rating, 'desc')];
      case 'yourStars':
        return [nullsLast(yourStars(theirs), 'desc')];
    }
  };

  const seriesOrder = (order: TitleOrder): SQL[] => {
    switch (order) {
      case 'random':
        return [asc(shuffledBy(series.id, listId, now))];
      case 'added':
        return [desc(max(mediaItem.addedAt))];
      case 'released':
        return [nullsLast(min(mediaItem.year), 'desc')];
      case 'title':
        return [];
      case 'rating':
        return [nullsLast(max(mediaItem.rating), 'desc')];
      case 'yourStars':
        return [nullsLast(seriesStars, 'desc')];
    }
  };

  const films = async (): Promise<SmartTitle[]> => {
    const rows = await db
      .select({ id: mediaItem.id, addedAt: mediaItem.addedAt })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .leftJoin(watchProgress, progress)
      .where(
        and(
          isNull(mediaItem.seriesId),
          isNull(mediaItem.seriesTitle),
          isNull(mediaItem.extraKind),
          isNull(mediaItem.parentId),
          isNotATrack(db),
          seen,
          ...rules.rules.map(filmCondition),
        ),
      )
      .orderBy(...filmOrder(rules.order), asc(mediaItem.title), asc(mediaItem.id))
      .limit(limit);

    return rows.map((row) => ({ kind: 'film' as const, ...row }));
  };

  const programmes = async (): Promise<SmartTitle[]> => {
    const rows = await db
      .select({ id: series.id, addedAt: max(mediaItem.addedAt) })
      .from(mediaItem)
      .innerJoin(series, eq(series.id, mediaItem.seriesId))
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .leftJoin(watchProgress, progress)
      .where(and(isNull(mediaItem.extraKind), isNull(mediaItem.parentId), seen))
      .groupBy(series.id, series.title)
      .having(and(...rules.rules.map(seriesCondition)))
      .orderBy(...seriesOrder(rules.order), asc(series.title), asc(series.id))
      .limit(limit);

    return rows.flatMap((row) =>
      row.addedAt === null ? [] : [{ kind: 'series' as const, ...row, addedAt: row.addedAt }],
    );
  };

  return rules.holds === 'films' ? films() : programmes();
};

export type { SmartTitle, TitlesAsked };

export { titlesMatching };
