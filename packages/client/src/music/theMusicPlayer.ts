import { fetchTracks, trackStreamUrl } from '@ValenceClient/music/fetchMusic';
import { readMusicPreferences, saveMusicPreferences } from '@ValenceClient/music/musicPreferences';
import { reportNowPlaying, sendMusicCommand } from '@ValenceClient/music/musicDevices';
import { createMusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';

let made: MusicPlayer | null = null;

/**
 * The client's music player, made the first time anything asks for it.
 *
 * One player for the whole client, playing through whatever audio the host hands over — an audio
 * element in a browser, the system's own player on a television — and held here rather than by a
 * screen, so a song carries on while somebody browses, opens a dialog or goes somewhere else.
 *
 * @returns The player.
 */
const theMusicPlayer = (): MusicPlayer => {
  if (made !== null) {
    return made;
  }

  const { audio, canPlay } = platformInUse().musicAudio();

  made = createMusicPlayer({
    audio,
    streamUrl: trackStreamUrl,
    canPlay,
    fetchTracks,
    report: (nowPlaying) => {
      void reportNowPlaying(nowPlaying).catch(() => false);
    },
    command: sendMusicCommand,
    preferences: { read: readMusicPreferences, save: saveMusicPreferences },
    now: () => Date.now(),
  });

  return made;
};

/**
 * Forgets the client's player, so a test starts from nothing.
 */
const forgetTheMusicPlayer = (): void => {
  made?.stop();
  made = null;
};

export { forgetTheMusicPlayer, theMusicPlayer };
