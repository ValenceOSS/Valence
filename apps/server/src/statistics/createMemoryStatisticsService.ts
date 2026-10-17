import type { HistoryService } from '@ValenceServer/history/HistoryService';
import { RANGE_DAYS } from './RANGE_DAYS';
import { SAME_PLAY_MS } from './SAME_PLAY_MS';
import { summariseStatistics } from './summariseStatistics';
import type { PlayRow } from './StatisticsInputs';
import type { PlayToRecord, StatisticsService } from './StatisticsService';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The statistics service held in memory, for a server running without a database: plays are kept
 * until it stops, and what was watched comes from the history it was given.
 *
 * @param history - Where what was watched is kept, if anywhere.
 * @param now - The clock.
 * @returns The statistics service.
 */
const createMemoryStatisticsService = (
  history?: HistoryService,
  now: () => Date = () => new Date(),
): StatisticsService => {
  const plays: (PlayRow & Pick<PlayToRecord, 'profileId' | 'mediaItemId'>)[] = [];

  return {
    recordPlay: (play) => {
      const at = now();
      const recent = plays.find(
        (one) =>
          one.mediaItemId === play.mediaItemId &&
          one.profileId === play.profileId &&
          one.client === play.client &&
          at.getTime() - one.at.getTime() < SAME_PLAY_MS,
      );

      if (recent === undefined) {
        plays.push({ ...play, at });
      } else {
        recent.mode = play.mode;
        recent.reasons = play.reasons;
      }

      return Promise.resolve();
    },
    read: async (range, zone) => {
      const end = now();
      const from = end.getTime() - RANGE_DAYS[range] * DAY_MS;
      const recent = history === undefined ? [] : await history.recent({ limit: 10_000 });

      return summariseStatistics({
        range,
        zone,
        now: end,
        viewings: recent
          .filter((viewing) => new Date(viewing.startedAt).getTime() >= from)
          .map((viewing) => ({
            mediaItemId: viewing.mediaItemId,
            title: viewing.title ?? '',
            seriesId: viewing.seriesId,
            seriesTitle: viewing.seriesTitle,
            profileId: viewing.profileId,
            profileName: viewing.profileName,
            startedAt: new Date(viewing.startedAt),
            secondsWatched: viewing.secondsWatched,
          })),
        plays: plays.filter((play) => play.at.getTime() >= from),
        added: [],
      });
    },
  };
};

export { createMemoryStatisticsService };
