import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeadersFor } from '@ValenceTv/platform/theSessionToken';
import type { AudioPlayer, AudioStatus } from 'expo-audio';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

type SystemsAudio = AudioLike & ListeningAudio;

/**
 * Dresses one of the system's players as the audio element the client's players were written
 * against, so the music's queue and an audiobook's chapters are the web's own rather than a second
 * copy of them.
 *
 * A path is sent to the server with this television's session, since the system's player does not
 * go through `fetch`. What the system says as it plays is turned into the element's events —
 * loaded, playing, paused, waiting, moved on, finished, failed. A speed is played at without
 * lowering the voice, which is what a book read quickly needs.
 *
 * @param system - The system's player.
 * @returns The audio.
 */
const dressTheSystemsPlayer = (system: AudioPlayer): SystemsAudio => {
  const heard = new Map<string, Set<() => void>>();
  const tell = (type: string): void => {
    heard.get(type)?.forEach((listener) => {
      listener();
    });
  };

  let source = '';
  let hasLoaded = false;
  let wasPlaying = false;
  let wasBuffering = false;
  let hasFailed = false;

  system.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (status.playbackState === 'failed') {
      if (!hasFailed) {
        hasFailed = true;
        tell('error');
      }

      return;
    }

    if (status.isLoaded && !hasLoaded) {
      hasLoaded = true;
      tell('loadedmetadata');
      tell('canplay');
    }

    if (status.isBuffering !== wasBuffering) {
      wasBuffering = status.isBuffering;
      tell(status.isBuffering ? 'waiting' : 'canplay');
    }

    if (status.playing !== wasPlaying) {
      wasPlaying = status.playing;

      if (status.playing) {
        tell('playing');
      } else if (!status.didJustFinish) {
        tell('pause');
      }
    }

    if (hasLoaded) {
      tell('timeupdate');
    }

    if (status.didJustFinish) {
      tell('ended');
    }
  });

  return {
    get src() {
      return source;
    },
    set src(path: string) {
      source = path;
      hasLoaded = false;
      hasFailed = false;
      wasPlaying = false;
      system.replace(
        path === '' ? null : { uri: onTheServer(path), headers: signedHeadersFor(path) },
      );
      tell('waiting');
    },
    get currentTime() {
      return system.currentTime;
    },
    set currentTime(seconds: number) {
      void system.seekTo(seconds).then(() => {
        tell('timeupdate');
        tell('seeked');
      });
    },
    get duration() {
      return hasLoaded && system.duration > 0 ? system.duration : Number.NaN;
    },
    get volume() {
      return system.volume;
    },
    set volume(level: number) {
      system.volume = level;
    },
    get muted() {
      return system.muted;
    },
    set muted(isMuted: boolean) {
      system.muted = isMuted;
    },
    get playbackRate() {
      return system.playbackRate;
    },
    set playbackRate(rate: number) {
      system.setPlaybackRate(rate, 'high');
    },
    get paused() {
      return !system.playing;
    },
    play: () => {
      system.play();

      return Promise.resolve();
    },
    pause: () => {
      system.pause();
    },
    addEventListener: (type, listener) => {
      const listeners = heard.get(type) ?? new Set<() => void>();

      listeners.add(listener);
      heard.set(type, listeners);
    },
  };
};

export type { SystemsAudio };

export { dressTheSystemsPlayer };
