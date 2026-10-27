import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { twoDeckAudio } from './twoDeckAudio';
import type { Deck } from './twoDeckAudio';

type FakeDeck = Deck & { paused: boolean; fire: (type: string) => void };

/**
 * An audio element that plays nothing, tells when it is told to, and remembers what it was handed.
 *
 * @returns The element.
 */
const aDeck = (): FakeDeck => {
  const heard = new Map<string, (() => void)[]>();
  const deck: FakeDeck = {
    src: '',
    currentTime: 0,
    duration: 200,
    volume: 1,
    muted: false,
    paused: true,
    preload: '',
    error: null,
    play: () => {
      deck.paused = false;

      return Promise.resolve();
    },
    pause: () => {
      deck.paused = true;
    },
    load: () => undefined,
    removeAttribute: () => {
      deck.src = '';
    },
    addEventListener: (type: string, listener: () => void) => {
      heard.set(type, [...(heard.get(type) ?? []), listener]);
    },
    canPlayType: () => 'maybe',
    fire: (type: string) => {
      for (const listener of heard.get(type) ?? []) {
        listener();
      }
    },
  };

  return deck;
};

const decksOf = () => {
  const made: FakeDeck[] = [];
  const { audio, canPlay } = twoDeckAudio({
    make: () => {
      const deck = aDeck();

      made.push(deck);

      return deck;
    },
    every: (ms, tick) => {
      const timer = setInterval(tick, ms);

      return () => {
        clearInterval(timer);
      };
    },
  });
  const [first, second] = made;

  if (first === undefined || second === undefined) {
    throw new Error('Two decks were not made.');
  }

  return { audio, canPlay, first, second };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('twoDeckAudio', () => {
  it('plays a song on one element and tells where it is', async () => {
    const { audio, first } = decksOf();

    audio.src = '/stream/1';
    await audio.play();
    first.currentTime = 12;

    expect(first.src).toBe('/stream/1');
    expect(audio.src).toBe('/stream/1');
    expect(audio.currentTime).toBe(12);
    expect(audio.paused).toBe(false);
  });

  it('loads the next song on the other element before this one ends', () => {
    const { audio, second } = decksOf();

    audio.src = '/stream/1';
    audio.lineUp?.('/stream/2', 0.5);

    expect(second.src).toBe('/stream/2');
    expect(second.paused).toBe(true);
  });

  it('starts the next song the moment this one ends, and says it moved on', async () => {
    const { audio, first, second } = decksOf();
    const advanced = vi.fn();
    const ended = vi.fn();

    audio.addEventListener('advanced', advanced);
    audio.addEventListener('ended', ended);
    audio.src = '/stream/1';
    await audio.play();
    audio.lineUp?.('/stream/2', 0.5);
    first.fire('ended');

    expect(advanced).toHaveBeenCalledOnce();
    expect(ended).not.toHaveBeenCalled();
    expect(second.paused).toBe(false);
    expect(second.volume).toBe(0.5);
    expect(audio.src).toBe('/stream/2');
  });

  it('says a song ended where nothing is lined up after it', () => {
    const { audio, first } = decksOf();
    const ended = vi.fn();

    audio.addEventListener('ended', ended);
    audio.src = '/stream/1';
    first.fire('ended');

    expect(ended).toHaveBeenCalledOnce();
  });

  it('only passes on what the element playing says', async () => {
    const { audio, second } = decksOf();
    const timeupdate = vi.fn();

    audio.addEventListener('timeupdate', timeupdate);
    audio.src = '/stream/1';
    await audio.play();
    audio.lineUp?.('/stream/2', 1);
    second.fire('timeupdate');

    expect(timeupdate).not.toHaveBeenCalled();
  });

  it('fades the next song in over the end of this one, for a crossfade', async () => {
    const { audio, first, second } = decksOf();
    const advanced = vi.fn();

    audio.addEventListener('advanced', advanced);
    audio.crossfade?.(4);
    audio.src = '/stream/1';
    audio.volume = 0.8;
    await audio.play();
    audio.lineUp?.('/stream/2', 0.6);
    first.currentTime = 197;
    first.fire('timeupdate');

    expect(advanced).toHaveBeenCalledOnce();
    expect(second.paused).toBe(false);
    expect(second.volume).toBe(0);

    vi.advanceTimersByTime(2000);

    expect(first.volume).toBeGreaterThan(0);
    expect(first.volume).toBeLessThan(0.8);
    expect(second.volume).toBeGreaterThan(0);
    expect(second.volume).toBeLessThan(0.6);

    vi.advanceTimersByTime(2100);

    expect(first.paused).toBe(true);
    expect(second.volume).toBe(0.6);
  });

  it('holds the song after next until the fade has finished with the other element', async () => {
    const { audio, first } = decksOf();

    audio.crossfade?.(4);
    audio.src = '/stream/1';
    await audio.play();
    audio.lineUp?.('/stream/2', 1);
    first.currentTime = 197;
    first.fire('timeupdate');
    audio.lineUp?.('/stream/3', 1);

    expect(first.src).toBe('/stream/1');

    vi.advanceTimersByTime(4100);

    expect(first.src).toBe('/stream/3');
  });

  it('takes a new loudness for the song lined up without loading it again', () => {
    const { audio, second } = decksOf();
    const load = vi.spyOn(second, 'load');

    audio.lineUp?.('/stream/2', 1);
    audio.lineUp?.('/stream/2', 0.3);

    expect(load).toHaveBeenCalledOnce();
  });

  it('empties the other element where nothing comes next', () => {
    const { audio, second } = decksOf();

    audio.lineUp?.('/stream/2', 1);
    audio.lineUp?.('', 0);

    expect(second.src).toBe('');
  });

  it('mutes both elements together', () => {
    const { audio, first, second } = decksOf();

    audio.muted = true;

    expect(first.muted).toBe(true);
    expect(second.muted).toBe(true);
    expect(audio.muted).toBe(true);
  });

  it('can play a kind of file the elements say they might', () => {
    expect(decksOf().canPlay('audio/flac')).toBe(true);
  });
});
