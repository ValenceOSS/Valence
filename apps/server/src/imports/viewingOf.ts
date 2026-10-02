import type { RatingSubject } from '@ValenceServer/ratings/RatingService';
import { spreadPlays } from './spreadPlays';
import { starsOf } from './starsOf';
import type { SourceCatalogue } from './readSourceCatalogue';
import type { SourcePlay, SourceUserState } from './SourceReader';

type PersonViewing = {
  watched: { mediaItemId: string; durationSeconds: number; at: Date }[];
  resumes: { mediaItemId: string; positionSeconds: number; durationSeconds: number; at: Date }[];
  plays: { mediaItemId: string; at: Date; secondsWatched: number; importKey: string }[];
  favourites: string[];
  ratings: { subject: RatingSubject; stars: number }[];
  unkeptFavourites: number;
};

type ViewingReading = {
  sourceId: string;
  userId: string;
  states: readonly SourceUserState[];
  plays: readonly SourcePlay[];
  catalogue: Pick<SourceCatalogue, 'byId' | 'matches'>;
  durations: ReadonlyMap<string, number>;
  now: Date;
};

const DAY_MS = 86_400_000;

/**
 * Works out what one person's watching on the old server becomes in Valence: what they finished,
 * where they stopped, each viewing with its date, what they kept and how they rated it.
 *
 * @param reading - The source, the person, their state and plays there, what each item matched,
 *   how long each Valence item runs, and the time now.
 * @returns What to write for them.
 */
const viewingOf = ({
  sourceId,
  userId,
  states,
  plays,
  catalogue,
  durations,
  now,
}: ViewingReading): PersonViewing => {
  const viewing: PersonViewing = {
    watched: [],
    resumes: [],
    plays: [],
    favourites: [],
    ratings: [],
    unkeptFavourites: 0,
  };
  const realPlays = new Map<string, SourcePlay[]>();

  for (const play of plays) {
    realPlays.set(play.itemId, [...(realPlays.get(play.itemId) ?? []), play]);
  }

  const durationOf = (mediaItemId: string, itemId: string): number =>
    durations.get(mediaItemId) ?? catalogue.byId.get(itemId)?.durationSeconds ?? 0;

  for (const [itemId, itemPlays] of realPlays) {
    const match = catalogue.matches.get(itemId);

    if (match?.kind !== 'item') {
      continue;
    }

    for (const play of itemPlays) {
      viewing.plays.push({
        mediaItemId: match.mediaItemId,
        at: play.at,
        secondsWatched: durationOf(match.mediaItemId, itemId),
        importKey: `${sourceId}:${play.key}`,
      });
    }
  }

  for (const state of states) {
    const match = catalogue.matches.get(state.itemId);
    const item = catalogue.byId.get(state.itemId);

    if (match === undefined || match.kind === 'unmatched') {
      continue;
    }

    const stars = starsOf(state.rating);

    if (match.kind === 'series') {
      viewing.unkeptFavourites += state.isFavourite ? 1 : 0;

      if (stars !== null) {
        viewing.ratings.push({ subject: { seriesId: match.seriesId }, stars });
      }

      continue;
    }

    const durationSeconds = durationOf(match.mediaItemId, state.itemId);
    const at = state.lastPlayedAt ?? now;

    if (state.isPlayed) {
      viewing.watched.push({ mediaItemId: match.mediaItemId, durationSeconds, at });
    } else if (state.positionSeconds > 0) {
      viewing.resumes.push({
        mediaItemId: match.mediaItemId,
        positionSeconds: Math.min(state.positionSeconds, durationSeconds || state.positionSeconds),
        durationSeconds: durationSeconds || state.positionSeconds,
        at,
      });
    }

    if (state.isFavourite) {
      viewing.favourites.push(match.mediaItemId);
    }

    if (stars !== null) {
      viewing.ratings.push({ subject: { mediaId: match.mediaItemId }, stars });
    }

    const real = realPlays.get(state.itemId) ?? [];
    const counted =
      state.playCount > 0 ? state.playCount : state.isPlayed && state.lastPlayedAt !== null ? 1 : 0;
    const missing = Math.max(counted - real.length, 0);
    const earliestReal = real.reduce<number | null>(
      (earliest, play) =>
        earliest === null ? play.at.getTime() : Math.min(earliest, play.at.getTime()),
      null,
    );
    const anchor =
      earliestReal === null
        ? (state.lastPlayedAt ?? item?.addedAt ?? null)
        : new Date(earliestReal - DAY_MS);

    if (missing === 0 || anchor === null) {
      continue;
    }

    for (const [ordinal, date] of spreadPlays(missing, anchor, item?.addedAt ?? null).entries()) {
      viewing.plays.push({
        mediaItemId: match.mediaItemId,
        at: date,
        secondsWatched: durationSeconds,
        importKey: `${sourceId}:${userId}:${state.itemId}:${ordinal.toString()}`,
      });
    }
  }

  return viewing;
};

export type { PersonViewing };

export { viewingOf };
