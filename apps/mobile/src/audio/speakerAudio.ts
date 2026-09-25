import { z } from 'zod';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';
import type { Channel, NativeMusic } from '@ValenceMobile/music/NativeMusic.types';

const AudioEventSchema = z.object({
  channel: z.enum(['music', 'book']),
  type: z.string(),
  currentTime: z.number(),
  duration: z.number(),
  paused: z.boolean(),
});

/**
 * One of the phone's speakers, dressed as the audio element the shared players were written
 * against, so the queue, a book's chapters, the reporting and everything else the web does is done
 * here by the same code. Music and books each have a speaker, named by its channel, so a book does
 * not throw away the song that was loaded.
 *
 * It keeps its own note of where the file is, how long it is and whether it is paused, taken from
 * what the speaker last said, so the player can read them without waiting on it. A file is asked
 * for from this phone's server with this phone's session, since the speaker is not the app and
 * would otherwise arrive at the server as nobody; anything the player asks of a file before it has
 * been handed over waits for it. Taking the file away stops the speaker.
 *
 * @param speaker - The native music module.
 * @param channel - Which of its speakers.
 * @returns What a player plays through.
 */
const speakerAudio = (speaker: NativeMusic, channel: Channel): AudioLike & ListeningAudio => {
  const listeners = new Map<string, Set<() => void>>();
  let source = '';
  let at = 0;
  let long = Number.NaN;
  let isPaused = true;
  let loudness = 1;
  let isMuted = false;
  let rate = 1;
  let handedOver: Promise<void> = Promise.resolve();

  speaker.addListener('onAudio', (said) => {
    const read = AudioEventSchema.safeParse(said);

    if (!read.success || read.data.channel !== channel) {
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
      source = to;
      at = 0;
      long = Number.NaN;

      if (to === '') {
        isPaused = true;
        handedOver = Promise.resolve();
        speaker.stop(channel);

        return;
      }

      const whole = to.startsWith('/') ? onThisServer(to) : to;

      handedOver = theCookiesThisPhoneHolds(whole).then((cookie) => {
        speaker.load(channel, whole, cookie);
      });
    },
    get currentTime() {
      return at;
    },
    set currentTime(to: number) {
      at = to;
      void handedOver.then(() => {
        speaker.seek(channel, to);
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
      speaker.setVolume(channel, to);
    },
    get muted() {
      return isMuted;
    },
    set muted(to: boolean) {
      isMuted = to;
      speaker.setMuted(channel, to);
    },
    get playbackRate() {
      return rate;
    },
    set playbackRate(to: number) {
      rate = to;
      speaker.setRate(channel, to);
    },
    get paused() {
      return isPaused;
    },
    play: async () => {
      isPaused = false;
      await handedOver;
      speaker.play(channel);
    },
    pause: () => {
      isPaused = true;
      speaker.pause(channel);
    },
    addEventListener: (type, listener) => {
      const held = listeners.get(type) ?? new Set<() => void>();

      held.add(listener);
      listeners.set(type, held);
    },
  };
};

export { speakerAudio };
