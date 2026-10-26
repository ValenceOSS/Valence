import { z } from 'zod';
import { theBrowserAudio } from '@ValenceScreens/music/theBrowserAudio';
import type { ListeningFiles } from '@ValenceClient/platform/Platform.types';
import { say } from '@ValenceI18n/say';

const OutcomeSchema = z
  .object({ bytes: z.number(), isComplete: z.boolean(), failure: z.string().nullable() })
  .catch({ bytes: 0, isComplete: false, failure: say('common.downloadFailed') });

const ProgressSchema = z.object({
  name: z.string(),
  bytes: z.number(),
  ofBytes: z.number().nullable(),
});

/**
 * The songs, audiobook tracks and covers this machine keeps, fetched by the process that owns the
 * disk and played from this client's own origin.
 *
 * @returns What the platform keeps them through.
 */
const theDesktopsListeningFiles = (): ListeningFiles => {
  const { listening } = window.valence;

  return {
    fetch: async (from, name, report) => {
      const stopHearing = listening.whenProgress((said) => {
        const progress = ProgressSchema.safeParse(said);

        if (progress.success && progress.data.name === name) {
          report(progress.data.bytes, progress.data.ofBytes);
        }
      });

      try {
        return OutcomeSchema.parse(await listening.fetch(from, name));
      } finally {
        stopHearing();
      }
    },
    stop: listening.stop,
    drop: listening.drop,
    has: listening.has,
    addressOf: (name) => `/held/listening/${name}`,
    canPlay: (type) => theBrowserAudio().canPlay(type),
  };
};

export { theDesktopsListeningFiles };
