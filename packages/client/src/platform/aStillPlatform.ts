import { alwaysReachable } from '@ValenceClient/platform/alwaysReachable';
import { noFilesAreKept } from '@ValenceClient/platform/noFilesAreKept';
import { noListeningFilesAreKept } from '@ValenceClient/platform/noListeningFilesAreKept';
import { say } from '@ValenceI18n/say';
import type { Platform } from '@ValenceClient/platform/Platform.types';

/**
 * A platform with nothing behind it: preferences kept in memory, no server, no files and silent
 * audio, for drawing the application where it is only being shown, such as the landing site.
 *
 * @returns Something to install.
 */
const aStillPlatform = (): Platform => {
  const kept = new Map<string, string>();

  return {
    store: {
      read: (key) => kept.get(key) ?? null,
      write: (key, value) => {
        kept.set(key, value);
      },
      forget: (key) => {
        kept.delete(key);
      },
    },
    serverAddress: () => null,
    describeThisClient: () => say('common.valence'),
    openSocket: () => ({ send: () => {}, close: () => {} }),
    thisClientId: () => 'client-1',
    thisClientKind: () => 'browser',
    canKeepFiles: () => true,
    held: noFilesAreKept(),
    listeningFiles: noListeningFilesAreKept(),
    reachability: alwaysReachable(),
    buildInfo: () => null,
    notifyLocally: () => {},
    setUnreadBadge: () => {},
    musicAudio: () => ({
      audio: {
        src: '',
        currentTime: 0,
        duration: Number.NaN,
        volume: 1,
        muted: false,
        paused: true,
        play: () => Promise.resolve(),
        pause: () => {},
        addEventListener: () => {},
      },
      canPlay: () => true,
    }),
    listeningAudio: () => ({
      src: '',
      currentTime: 0,
      duration: Number.NaN,
      playbackRate: 1,
      paused: true,
      play: () => Promise.resolve(),
      pause: () => {},
      addEventListener: () => {},
    }),
    passkeys: () => ({ kind: 'in-the-page' }),
  };
};

export { aStillPlatform };
