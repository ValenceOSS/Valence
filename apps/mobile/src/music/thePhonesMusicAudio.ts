import { z } from 'zod';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';
import type { NativeMusic } from './NativeMusic.types';

const AudioEventSchema = z.object({
  type: z.string(),
  currentTime: z.number(),
  duration: z.number(),
  paused: z.boolean(),
});

/**
 * The phone's speaker, dressed as the audio element the shared music player was written against,
 * so the queue, the reporting and everything else the web does is done here by the same code.
 *
 * It keeps its own note of where the track is, how long it is and whether it is paused, taken
 * from what the speaker last said, so the player can read them without waiting on it. A track is
 * asked for from this phone's server with this phone's session, since the speaker is not the app
 * and would otherwise arrive at the server as nobody; anything the player asks of a track before
 * it has been handed over waits for it.
 *
 * @param speaker - The native music module.
 * @returns What the music player plays through.
 */
const thePhonesMusicAudio = (speaker: NativeMusic): AudioLike => {
  const listeners = new Map<string, Set<() => void>>();
  let source = '';
  let at = 0;
  let long = Number.NaN;
  let isPaused = true;
  let loudness = 1;
  let isMuted = false;
  let handedOver: Promise<void> = Promise.resolve();

  speaker.addListener('onAudio', (said) => {
    const read = AudioEventSchema.safeParse(said);

    if (!read.success) {
      return;
    }

    at = read.data.currentTime;
    long = read.data.duration < 0 ? Number.NaN : read.data.duration;
    isPaused = read.data.paused;
    listeners.get(read.data.type)?.forEach((listener) => {
      listener();
    });
  });

  return {
    get src() {
      return source;
    },
    set src(to: string) {
      const whole = to.startsWith('/') ? onThisServer(to) : to;

      source = to;
      at = 0;
      long = Number.NaN;
      handedOver = theCookiesThisPhoneHolds(whole).then((cookie) => {
        speaker.load(whole, cookie);
      });
    },
    get currentTime() {
      return at;
    },
    set currentTime(to: number) {
      at = to;
      void handedOver.then(() => {
        speaker.seek(to);
      });
    },
    get duration() {
      return long;
    },
    get volume() {
      return loudness;
    },
    set volume(to: number) {
      loudness = to;
      speaker.setVolume(to);
    },
    get muted() {
      return isMuted;
    },
    set muted(to: boolean) {
      isMuted = to;
      speaker.setMuted(to);
    },
    get paused() {
      return isPaused;
    },
    play: async () => {
      isPaused = false;
      await handedOver;
      speaker.play();
    },
    pause: () => {
      isPaused = true;
      speaker.pause();
    },
    addEventListener: (type, listener) => {
      const held = listeners.get(type) ?? new Set<() => void>();

      held.add(listener);
      listeners.set(type, held);
    },
  };
};

export { thePhonesMusicAudio };
