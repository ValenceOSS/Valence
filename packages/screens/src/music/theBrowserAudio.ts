import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';
import { twoDeckAudio } from '@ValenceScreens/music/twoDeckAudio';
import type { TwoDecks } from '@ValenceScreens/music/twoDeckAudio';

let made: TwoDecks | null = null;

/**
 * The audio a browser window plays its music through, made the first time anything asks for it:
 * what a browser or the desktop hands the client's player to play with. It is two audio elements
 * played as one, so the next song is loaded before this one ends and starts without a gap, or
 * fades in over its end where somebody asked for a crossfade.
 *
 * @returns The audio, and whether it can play a kind of file.
 */
const theBrowserAudio = (): { audio: AudioLike; canPlay: (type: string) => boolean } => {
  made ??= twoDeckAudio({
    make: () => new Audio(),
    every: (ms, tick) => {
      const timer = setInterval(tick, ms);

      return () => {
        clearInterval(timer);
      };
    },
  });

  return made;
};

/**
 * Forgets the window's audio, so a test starts from nothing.
 */
const forgetTheBrowserAudio = (): void => {
  made = null;
};

export { forgetTheBrowserAudio, theBrowserAudio };
