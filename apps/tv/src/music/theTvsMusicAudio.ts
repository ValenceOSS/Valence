import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeadersFor } from '@ValenceTv/platform/theSessionToken';
import type { AudioPlayer, AudioStatus } from 'expo-audio';
import type { MusicAudio } from '@ValenceClient/platform/Platform.types';

const STATUS_EVERY_MS = 250;

const UNPLAYABLE = new Set(['audio/ogg; codecs="opus"', 'audio/ogg; codecs="vorbis"']);

let made: MusicAudio | null = null;

let player: AudioPlayer | null = null;

/**
 * The television's music audio: the system's own player, dressed as the audio element the client's
 * player was written against, so the queue, the reporting and the remote control are the web's
 * own rather than a second copy of them.
 *
 * A path is sent to the server with this television's session, since the system's player does not
 * go through `fetch`. What the system says of the song as it plays is turned into the element's
 * events — loaded, playing, paused, waiting, moved on, finished, failed. Music is played with the
 * app in the background too, and the system is asked to show it as what is playing.
 *
 * @returns The audio, and whether the television plays a kind of file as it is.
 */
const theTvsMusicAudio = (): MusicAudio => {
  if (made !== null) {
    return made;
  }

  const heard = new Map<string, Set<() => void>>();
  const tell = (type: string): void => {
    heard.get(type)?.forEach((listener) => {
      listener();
    });
  };

  const system = createAudioPlayer(null, { updateInterval: STATUS_EVERY_MS });

  player = system;

  void setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  });

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

  made = {
    audio: {
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
    },
    canPlay: (type) => !UNPLAYABLE.has(type),
  };

  return made;
};

/**
 * The system's player the television's music plays through, for telling the system what is
 * playing.
 *
 * @returns The player, made along with the audio if nothing had asked for either yet.
 */
const theTvsMusicPlayer = (): AudioPlayer => {
  theTvsMusicAudio();

  return player ?? createAudioPlayer(null);
};

export { theTvsMusicAudio, theTvsMusicPlayer };
