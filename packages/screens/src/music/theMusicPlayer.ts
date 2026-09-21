import { fetchTracks, trackStreamUrl } from '@ValenceClient/music/fetchMusic';
import { readMusicPreferences, saveMusicPreferences } from '@ValenceClient/music/musicPreferences';
import { reportNowPlaying, sendMusicCommand } from '@ValenceClient/music/musicDevices';
import { createMusicPlayer } from './createMusicPlayer';
import type { MusicPlayer } from './createMusicPlayer';

let made: MusicPlayer | null = null;
let element: HTMLAudioElement | null = null;

/**
 * The window's music player, made the first time anything asks for it.
 *
 * One audio element for the whole window, held here rather than by a screen, so a song carries on
 * while somebody browses, opens a dialog or goes to the admin area.
 *
 * @returns The player.
 */
const theMusicPlayer = (): MusicPlayer => {
  if (made !== null) {
    return made;
  }

  const audio = new Audio();

  audio.preload = 'auto';
  element = audio;

  made = createMusicPlayer({
    audio,
    streamUrl: trackStreamUrl,
    canPlay: (type) => audio.canPlayType(type) !== '',
    fetchTracks,
    report: (nowPlaying) => {
      void reportNowPlaying(nowPlaying);
    },
    command: sendMusicCommand,
    preferences: { read: readMusicPreferences, save: saveMusicPreferences },
    now: () => Date.now(),
  });

  return made;
};

/**
 * The audio element the window's player plays through, for whatever needs to listen to it.
 *
 * @returns The element, made along with the player if nothing had asked for either yet.
 */
const theMusicAudio = (): HTMLAudioElement => {
  theMusicPlayer();

  return element ?? new Audio();
};

/**
 * Forgets the window's player, so a test starts from nothing.
 */
const forgetTheMusicPlayer = (): void => {
  made?.stop();
  made = null;
  element = null;
};

export { forgetTheMusicPlayer, theMusicAudio, theMusicPlayer };
