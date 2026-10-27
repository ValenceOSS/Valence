import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';

type Deck = {
  src: string;
  currentTime: number;
  readonly duration: number;
  volume: number;
  muted: boolean;
  readonly paused: boolean;
  preload: string;
  readonly error: { code: number } | null;
  play: () => Promise<void>;
  pause: () => void;
  load: () => void;
  removeAttribute: (name: string) => void;
  addEventListener: (type: string, listener: () => void) => void;
  canPlayType: (type: string) => string;
};

type TwoDeckNeeds = {
  make: () => Deck;
  every: (ms: number, tick: () => void) => () => void;
};

type TwoDecks = {
  audio: AudioLike;
  canPlay: (type: string) => boolean;
};

const FADE_TICK_MS = 50;

const FORWARDED = [
  'play',
  'playing',
  'pause',
  'timeupdate',
  'durationchange',
  'loadedmetadata',
  'waiting',
  'canplay',
  'seeked',
  'error',
] as const;

/**
 * Two audio elements played as one: the song playing on one while the next loads on the other, so
 * it starts the moment this one ends, or fades in over the end of this one for somebody who asked
 * for a crossfade. Whatever asks the audio where it is, how long it is or whether it is paused is
 * told about the song now playing, and hears that it has moved on to the next as `advanced`,
 * rather than that this one ended.
 *
 * @param needs - How to make an element, and a clock to fade by.
 * @returns The audio, and whether it can play a kind of file.
 */
const twoDeckAudio = ({ make, every }: TwoDeckNeeds): TwoDecks => {
  const decks: [Deck, Deck] = [make(), make()];
  const listeners = new Map<string, Set<() => void>>();
  let playing = 0;
  let shownSrc = '';
  let linedUp: { src: string; volume: number } | null = null;
  let waiting: { src: string; volume: number } | null = null;
  let fadeSeconds = 0;
  let level = 1;
  let isMuted = false;
  let stopFade: (() => void) | null = null;

  for (const deck of decks) {
    deck.preload = 'auto';
  }

  const now = (): Deck => decks[playing === 0 ? 0 : 1];

  const spare = (): Deck => decks[playing === 0 ? 1 : 0];

  const emit = (type: string): void => {
    for (const listener of listeners.get(type) ?? []) {
      listener();
    }
  };

  const empty = (deck: Deck): void => {
    deck.pause();
    deck.removeAttribute('src');
    deck.load();
  };

  const load = (deck: Deck, src: string): void => {
    if (src === '') {
      empty(deck);

      return;
    }

    deck.src = src;
    deck.load();
  };

  /**
   * Hands the spare element the song lined up next, unless a fade still has it.
   *
   * @param next - The song, and how loud it plays.
   */
  const ready = (next: { src: string; volume: number } | null): void => {
    if (stopFade !== null) {
      waiting = next;

      return;
    }

    linedUp = next === null || next.src === '' ? null : next;
    load(spare(), linedUp?.src ?? '');
  };

  const settleFade = (): void => {
    stopFade?.();
    stopFade = null;
    empty(spare());
    now().volume = level;

    const next = waiting;

    waiting = null;
    ready(next);
  };

  /**
   * Moves the playing over to the song lined up: at once, or rising over a fade of the one before.
   *
   * @param isFading - Whether this song fades out under the next rather than having ended.
   */
  const moveOver = (isFading: boolean): void => {
    const next = linedUp;

    if (next === null) {
      return;
    }

    const leaving = now();
    const from = leaving.volume;
    const arriving = spare();

    linedUp = null;
    playing = playing === 0 ? 1 : 0;
    shownSrc = next.src;
    level = next.volume;
    arriving.muted = isMuted;
    arriving.currentTime = 0;
    arriving.volume = isFading ? 0 : level;
    arriving.play().catch(() => {
      emit('error');
    });

    if (isFading) {
      const startedAt = Date.now();
      const lasts = fadeSeconds * 1000;

      stopFade = every(FADE_TICK_MS, () => {
        const done = Math.min(1, (Date.now() - startedAt) / lasts);
        const angle = (done * Math.PI) / 2;

        leaving.volume = Math.max(0, from * Math.cos(angle));
        arriving.volume = Math.min(1, level * Math.sin(angle));

        if (done >= 1) {
          settleFade();
        }
      });
    } else {
      empty(leaving);
    }

    emit('advanced');
  };

  const isNearTheEnd = (deck: Deck): boolean =>
    fadeSeconds > 0 &&
    Number.isFinite(deck.duration) &&
    deck.duration > fadeSeconds * 2 &&
    deck.duration - deck.currentTime <= fadeSeconds;

  decks.forEach((deck, at) => {
    const isPlaying = (): boolean => at === playing;

    for (const type of FORWARDED) {
      deck.addEventListener(type, () => {
        if (!isPlaying()) {
          return;
        }

        if (
          type === 'timeupdate' &&
          stopFade === null &&
          linedUp !== null &&
          !deck.paused &&
          isNearTheEnd(deck)
        ) {
          moveOver(true);

          return;
        }

        emit(type);
      });
    }

    deck.addEventListener('ended', () => {
      if (!isPlaying()) {
        return;
      }

      if (linedUp !== null && spare().error === null) {
        moveOver(false);

        return;
      }

      emit('ended');
    });
  });

  const audio: AudioLike = {
    get src() {
      return shownSrc;
    },
    set src(src: string) {
      if (stopFade !== null) {
        settleFade();
      }

      shownSrc = src;
      load(now(), src);
    },
    get currentTime() {
      return now().currentTime;
    },
    set currentTime(seconds: number) {
      now().currentTime = seconds;
    },
    get duration() {
      return now().duration;
    },
    get volume() {
      return level;
    },
    set volume(volume: number) {
      level = volume;

      if (stopFade === null) {
        now().volume = volume;
      }
    },
    get muted() {
      return isMuted;
    },
    set muted(muted: boolean) {
      isMuted = muted;

      for (const deck of decks) {
        deck.muted = muted;
      }
    },
    get paused() {
      return now().paused;
    },
    play: () => now().play(),
    pause: () => {
      if (stopFade !== null) {
        settleFade();
      }

      now().pause();
    },
    addEventListener: (type, listener) => {
      const heard = listeners.get(type) ?? new Set<() => void>();

      heard.add(listener);
      listeners.set(type, heard);
    },
    lineUp: (src, volume) => {
      if (stopFade !== null) {
        waiting = { src, volume };

        return;
      }

      if (src !== '' && src === linedUp?.src) {
        linedUp = { src, volume };

        return;
      }

      ready({ src, volume });
    },
    crossfade: (seconds) => {
      fadeSeconds = Math.max(0, seconds);
    },
  };

  return { audio, canPlay: (type) => decks[0].canPlayType(type) !== '' };
};

export type { Deck, TwoDeckNeeds, TwoDecks };

export { twoDeckAudio };
