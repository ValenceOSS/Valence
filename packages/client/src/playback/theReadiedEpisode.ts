import { createReadiedEpisode } from '@ValenceClient/playback/createReadiedEpisode';
import type { ReadiedEpisode } from '@ValenceClient/playback/createReadiedEpisode';
import {
  heartbeatPlaybackSession,
  stopPlaybackSession,
} from '@ValenceClient/playback/startPlaybackSession';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

let made: ReadiedEpisode | null = null;

/**
 * The next episode made ready on this device, one for the whole app, so a player that remounts for
 * the next episode still finds the session the last one started for it.
 *
 * @returns What keeps it.
 */
const theReadiedEpisode = (): ReadiedEpisode => {
  made ??= createReadiedEpisode({
    stop: (sessionId) => {
      void stopPlaybackSession(sessionId, platformInUse().thisClientId());
    },
    beat: (sessionId) => {
      void heartbeatPlaybackSession(sessionId, false, platformInUse().thisClientId());
    },
    now: () => Date.now(),
    every: (run, ms) => {
      const timer = setInterval(run, ms);

      return () => {
        clearInterval(timer);
      };
    },
  });

  return made;
};

/**
 * Lets go of the next episode made ready, so one test cannot be handed another test's.
 */
const forgetTheReadiedEpisode = (): void => {
  made?.drop();
  made = null;
};

export { forgetTheReadiedEpisode, theReadiedEpisode };
