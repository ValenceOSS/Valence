import { say } from '@ValenceI18n/say';

const LENGTHS = [0, 2, 4, 6, 8, 12] as const;

/**
 * How long one song can fade into the next, named for a menu as every client offers it: off, where
 * each song starts the moment the last one ends, or a few seconds of the two overlapping.
 *
 * @returns Each length in seconds, and its name.
 */
const crossfadeChoices = (): { seconds: number; label: string; detail?: string }[] =>
  LENGTHS.map((seconds) =>
    seconds === 0
      ? {
          seconds,
          label: say('common.off'),
          detail: say('client.music.crossfadeChoices.eachSongStartsAsTheLast'),
        }
      : {
          seconds,
          label: say('client.music.crossfadeChoices.secondsSeconds', {
            seconds: seconds.toString(),
          }),
        },
  );

export { crossfadeChoices };
