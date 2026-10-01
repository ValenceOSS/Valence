import type { PresenceEntry } from '@ValenceServer/presence/PresenceService';

const REWOUND_BELOW_SECONDS = 2;

const REPLAYED_AFTER_SECONDS = 10;

type PlayReport = {
  itemId: string;
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
};

type Play<Report> = {
  device: PresenceEntry;
  report: Report;
  startedAtMs: number;
};

type PlayWatchers<Report> = {
  onStarted: (play: Play<Report>) => void;
  onStopped: (
    play: Play<Report>,
    reached: { positionSeconds: number; durationSeconds: number },
  ) => void;
};

type PlayTrackerOptions<Report> = PlayWatchers<Report> & {
  read: (report: Report) => PlayReport;
  now: () => number;
};

type PlayTracker<Report> = {
  report: (device: PresenceEntry, report: Report | null) => void;
};

type Playing<Report> = Play<Report> & {
  itemId: string;
  durationSeconds: number;
  furthestSeconds: number;
  heardAtMs: number;
  isPlaying: boolean;
  positionSeconds: number;
};

/**
 * Turns what devices keep saying they are playing into plays, each of which starts and stops once.
 *
 * A device reports on every change and every so often while playing, never the moment a song ends,
 * so where a play got to is the furthest it was known to be — worked forward from the last report
 * while it was playing, since reports come seconds apart. A play ends when the device moves to
 * something else, says it is playing nothing, goes away, or goes back to the start of the same
 * thing, which is how a queue that has run out, a song on repeat and a restart all look. A play
 * starts only once something is playing, so a queue left paused at its first song starts nothing.
 *
 * @param options - How to read a report, the clock, and who to tell of each start and stop.
 * @returns The tracker, told of every report and of every device that goes away (as `null`).
 */
const createPlayTracker = <Report>({
  read,
  now,
  onStarted,
  onStopped,
}: PlayTrackerOptions<Report>): PlayTracker<Report> => {
  const playing = new Map<string, Playing<Report>>();

  const reachedBy = (play: Playing<Report>, atMs: number): number => {
    const since = play.isPlaying ? (atMs - play.heardAtMs) / 1000 : 0;

    return Math.min(
      play.durationSeconds,
      Math.max(play.furthestSeconds, play.positionSeconds + since),
    );
  };

  const stop = (clientId: string, atMs: number): void => {
    const play = playing.get(clientId);

    if (play === undefined) {
      return;
    }

    playing.delete(clientId);
    onStopped(
      { device: play.device, report: play.report, startedAtMs: play.startedAtMs },
      { positionSeconds: reachedBy(play, atMs), durationSeconds: play.durationSeconds },
    );
  };

  return {
    report: (device, report) => {
      const atMs = now();
      const said = report === null ? null : read(report);
      const play = playing.get(device.clientId);

      if (play !== undefined) {
        const isElsewhere = said === null || said.itemId !== play.itemId;
        const isBackAtTheStart =
          said !== null &&
          said.positionSeconds < REWOUND_BELOW_SECONDS &&
          reachedBy(play, atMs) >= REPLAYED_AFTER_SECONDS;

        if (isElsewhere || isBackAtTheStart) {
          stop(device.clientId, atMs);
        } else if (report !== null) {
          playing.set(device.clientId, {
            ...play,
            device,
            report,
            durationSeconds: said.durationSeconds > 0 ? said.durationSeconds : play.durationSeconds,
            furthestSeconds: Math.max(reachedBy(play, atMs), said.positionSeconds),
            heardAtMs: atMs,
            isPlaying: said.isPlaying,
            positionSeconds: said.positionSeconds,
          });

          return;
        }
      }

      if (report === null || said === null || !said.isPlaying) {
        return;
      }

      const started: Playing<Report> = {
        device,
        report,
        startedAtMs: atMs,
        itemId: said.itemId,
        durationSeconds: said.durationSeconds,
        furthestSeconds: said.positionSeconds,
        heardAtMs: atMs,
        isPlaying: true,
        positionSeconds: said.positionSeconds,
      };

      playing.set(device.clientId, started);
      onStarted({ device, report, startedAtMs: atMs });
    },
  };
};

export type { Play, PlayReport, PlayTracker, PlayWatchers };

export { createPlayTracker };
