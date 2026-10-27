import type { StartOutcome, StartedSession } from '@ValenceClient/playback/startPlaybackSession';

const KEPT_FOR_MS = 10 * 60 * 1000;

const BEAT_EVERY_MS = 20_000;

type ReadiedChoices = {
  mediaId: string;
  startSeconds: number;
  audioStreamIndex: number | undefined;
  subtitleStreamIndex: number | undefined;
  quality: string | undefined;
};

type ReadiedEpisodeNeeds = {
  stop: (sessionId: string) => void;
  beat: (sessionId: string) => void;
  now: () => number;
  every: (run: () => void, ms: number) => () => void;
};

type ReadiedStart = { choices: ReadiedChoices; outcome: StartOutcome };

type ReadiedEpisode = {
  readyAhead: (mediaId: string, start: () => Promise<ReadiedStart>) => void;
  take: (choices: ReadiedChoices) => StartedSession | null;
  drop: () => void;
  isReadyingFor: (mediaId: string) => boolean;
};

type Held = {
  mediaId: string;
  choices: ReadiedChoices | null;
  session: StartedSession | null;
  isDropped: boolean;
  atMs: number;
  stopBeating: () => void;
};

/**
 * Whether two sets of choices would ask the server for the same session.
 *
 * @param one - The choices a session was made ready with.
 * @param other - The choices of the episode now starting.
 * @returns Whether the session made ready can play it.
 */
const isTheSame = (one: ReadiedChoices, other: ReadiedChoices): boolean =>
  one.mediaId === other.mediaId &&
  Math.floor(one.startSeconds) === Math.floor(other.startSeconds) &&
  one.audioStreamIndex === other.audioStreamIndex &&
  one.subtitleStreamIndex === other.subtitleStreamIndex &&
  one.quality === other.quality;

/**
 * Keeps the next episode's session, started before the one playing ends, so the next episode can
 * follow on with no gap: kept alive while it waits, handed over only to an episode starting with
 * the same choices it was made with, and stopped once it is not wanted or has waited too long.
 *
 * @param needs - How to stop and keep alive a session, the time, and a timer.
 * @returns What keeps it.
 */
const createReadiedEpisode = (needs: ReadiedEpisodeNeeds): ReadiedEpisode => {
  let held: Held | null = null;

  const letGo = (which: Held) => {
    which.isDropped = true;
    which.stopBeating();

    if (which.session !== null) {
      needs.stop(which.session.sessionId);
    }

    if (held === which) {
      held = null;
    }
  };

  return {
    readyAhead: (mediaId, start) => {
      if (held?.mediaId === mediaId) {
        return;
      }

      if (held !== null) {
        letGo(held);
      }

      const holding: Held = {
        mediaId,
        choices: null,
        session: null,
        isDropped: false,
        atMs: needs.now(),
        stopBeating: () => undefined,
      };

      held = holding;

      void start().then(({ choices, outcome }) => {
        if (outcome.kind !== 'started') {
          if (held === holding) {
            held = null;
          }

          return;
        }

        if (holding.isDropped) {
          needs.stop(outcome.session.sessionId);

          return;
        }

        holding.choices = choices;
        holding.session = outcome.session;
        holding.stopBeating = needs.every(() => {
          needs.beat(outcome.session.sessionId);
        }, BEAT_EVERY_MS);
      });
    },

    take: (choices) => {
      const which = held;

      if (which === null) {
        return null;
      }

      if (
        which.session === null ||
        which.choices === null ||
        !isTheSame(which.choices, choices) ||
        needs.now() - which.atMs > KEPT_FOR_MS
      ) {
        letGo(which);

        return null;
      }

      which.stopBeating();
      held = null;

      return which.session;
    },

    drop: () => {
      if (held !== null) {
        letGo(held);
      }
    },

    isReadyingFor: (mediaId) => held?.mediaId === mediaId,
  };
};

export type { ReadiedChoices, ReadiedEpisode, ReadiedEpisodeNeeds, ReadiedStart };

export { createReadiedEpisode };
