import { dressTheSystemsPlayer } from '@ValenceTv/audio/dressTheSystemsPlayer';
import type { AudioPlayer } from 'expo-audio';
import type { SystemsAudio } from '@ValenceTv/audio/dressTheSystemsPlayer';

const FADE_STEP_MS = 50;

const STATUS_LEAD_SECONDS = 0.25;

type PairedAudio = SystemsAudio & {
  lineUp: (src: string, volume?: number) => void;
  crossfade: (seconds: number) => void;
};

/**
 * Two of the television's players dressed as one audio element, so a song can be made ready on the
 * one not playing while the other plays, and started the moment the first ends, with no gap while it
 * loads. Where songs fade into each other, the next starts that many seconds before the end and the
 * two cross along a quarter of a circle each, so together they stay as loud as one.
 *
 * Whichever is playing is the one everything else reads: its time, its length, its events. The
 * other's are not heard. When the next song starts, the two swap, the lined-up song becomes the one
 * playing at the volume it was lined up with — the same song lined up again only changing that
 * volume — and it says it has advanced rather than ended, as a
 * phone's speaker says it — and whoever made the pair is told which player now plays, for the lock
 * screen and the sound bars that follow it.
 *
 * @param first - The player that plays first.
 * @param second - The player the next song is made ready on.
 * @param onSwap - Told which player plays now, each time the two swap.
 * @returns What a music player plays through.
 */
const pairTheSystemsPlayers = (
  first: AudioPlayer,
  second: AudioPlayer,
  onSwap: (playing: AudioPlayer) => void,
): PairedAudio => {
  const sides = [
    { system: first, audio: dressTheSystemsPlayer(first) },
    { system: second, audio: dressTheSystemsPlayer(second) },
  ];
  const heard = new Map<string, Set<() => void>>();
  const hooked = new Set<string>();
  let playing = 0;
  let next: { src: string; volume: number } | null = null;
  let crossfadeSeconds = 0;
  let loudness = 1;
  let isMuted = false;
  let fading: ReturnType<typeof setInterval> | null = null;

  const now = () => sides[playing] ?? sides[0];
  const other = () => sides[1 - playing] ?? sides[1];
  const tell = (type: string): void => {
    heard.get(type)?.forEach((listener) => {
      listener();
    });
  };

  /**
   * Ends a fade at once: the song before stops and is let go — or made ready as the next, where one
   * was lined up while the two crossed — and the one playing is heard at its own volume.
   */
  const finishTheFade = (): void => {
    if (fading === null) {
      return;
    }

    clearInterval(fading);
    fading = null;

    const before = other();

    if (before !== undefined) {
      before.audio.pause();
      before.audio.volume = 0;
      before.audio.src = next?.src ?? '';
    }

    const after = now();

    if (after !== undefined) {
      after.audio.volume = loudness;
    }
  };

  /**
   * Starts the lined-up song on the other player and swaps the two, fading over the given seconds
   * or none.
   *
   * @param seconds - How long the two cross, none cutting straight over.
   */
  const moveOn = (seconds: number): void => {
    const coming = next;
    const before = now();
    const after = other();

    if (coming === null || before === undefined || after === undefined) {
      return;
    }

    next = null;

    const wasLoud = loudness;

    loudness = coming.volume;
    after.audio.muted = isMuted;
    after.audio.volume = seconds > 0 ? 0 : loudness;
    void after.audio.play();
    playing = 1 - playing;
    onSwap(after.system);
    tell('advanced');

    if (!Number.isNaN(after.audio.duration)) {
      tell('loadedmetadata');
      tell('canplay');
    }

    tell('playing');

    if (seconds <= 0) {
      before.audio.pause();
      before.audio.src = '';

      return;
    }

    const began = Date.now();

    fading = setInterval(() => {
      const along = Math.min((Date.now() - began) / (seconds * 1000), 1);

      after.audio.volume = loudness * Math.sin((along * Math.PI) / 2);
      before.audio.volume = wasLoud * Math.cos((along * Math.PI) / 2);

      if (along >= 1) {
        finishTheFade();
      }
    }, FADE_STEP_MS);
  };

  /**
   * How long the song playing fades into the next: the seconds chosen, but never more than a third
   * of the song.
   *
   * @returns The seconds.
   */
  const fadeLength = (): number => {
    const { duration } = now()?.audio ?? { duration: Number.NaN };

    return Number.isNaN(duration) ? 0 : Math.min(crossfadeSeconds, duration / 3);
  };

  sides.forEach((side, at) => {
    side.audio.addEventListener('timeupdate', () => {
      const length = fadeLength();

      if (at !== playing || next === null || fading !== null || length <= 0) {
        return;
      }

      if (side.audio.currentTime >= side.audio.duration - length - STATUS_LEAD_SECONDS) {
        moveOn(length);
      }
    });
    side.audio.addEventListener('ended', () => {
      if (at === playing && next !== null) {
        moveOn(0);
      }
    });
  });

  /**
   * Hears an event from whichever player is playing, and not from the other.
   *
   * @param type - The event.
   */
  const hook = (type: string): void => {
    if (hooked.has(type)) {
      return;
    }

    hooked.add(type);
    sides.forEach((side, at) => {
      side.audio.addEventListener(type, () => {
        if (at !== playing || (type === 'ended' && next !== null)) {
          return;
        }

        tell(type);
      });
    });
  };

  return {
    get src() {
      return now()?.audio.src ?? '';
    },
    set src(path: string) {
      finishTheFade();
      next = null;

      const waiting = other();

      if (waiting !== undefined && waiting.audio.src !== '') {
        waiting.audio.src = '';
      }

      const side = now();

      if (side !== undefined) {
        side.audio.src = path;
      }
    },
    get currentTime() {
      return now()?.audio.currentTime ?? 0;
    },
    set currentTime(seconds: number) {
      finishTheFade();

      const side = now();

      if (side !== undefined) {
        side.audio.currentTime = seconds;
      }
    },
    get duration() {
      return now()?.audio.duration ?? Number.NaN;
    },
    get volume() {
      return loudness;
    },
    set volume(level: number) {
      loudness = level;

      const side = now();

      if (side !== undefined && fading === null) {
        side.audio.volume = level;
      }
    },
    get muted() {
      return isMuted;
    },
    set muted(to: boolean) {
      isMuted = to;
      sides.forEach((side) => {
        side.audio.muted = to;
      });
    },
    get playbackRate() {
      return now()?.audio.playbackRate ?? 1;
    },
    set playbackRate(rate: number) {
      const side = now();

      if (side !== undefined) {
        side.audio.playbackRate = rate;
      }
    },
    get paused() {
      return now()?.audio.paused ?? true;
    },
    play: () => now()?.audio.play() ?? Promise.resolve(),
    pause: () => {
      finishTheFade();
      now()?.audio.pause();
    },
    lineUp: (src: string, volume?: number) => {
      const waiting = other();

      if (next !== null && src === next.src) {
        next = { src, volume: volume ?? loudness };

        return;
      }

      next = src === '' ? null : { src, volume: volume ?? loudness };

      if (waiting === undefined || fading !== null) {
        return;
      }

      waiting.audio.volume = 0;
      waiting.audio.src = src;
    },
    crossfade: (seconds) => {
      crossfadeSeconds = Math.max(0, seconds);
    },
    addEventListener: (type, listener) => {
      const listeners = heard.get(type) ?? new Set<() => void>();

      listeners.add(listener);
      heard.set(type, listeners);
      hook(type);
    },
  };
};

export type { PairedAudio };

export { pairTheSystemsPlayers };
