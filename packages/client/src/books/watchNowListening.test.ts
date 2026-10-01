import { describe, expect, it, vi } from 'vitest';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';
import { watchNowListening } from './watchNowListening';
import type { AudiobookPlayer, AudiobookPlayerState } from './createAudiobookPlayer';
import type { NowListening } from '@ValenceContracts/schemas/BookRemote';

const { book } = anAudiobook();

const TRACKS = [
  { id: '00000000-0000-4000-8000-0000000000a1', title: 'One', durationSeconds: 1800, marks: [] },
  { id: '00000000-0000-4000-8000-0000000000a2', title: 'Two', durationSeconds: 1800, marks: [] },
];

const IDLE: AudiobookPlayerState = {
  book: null,
  tracks: [],
  chapters: [],
  trackAt: 0,
  bookPositionSeconds: 0,
  durationSeconds: 0,
  isPlaying: false,
  isLoading: false,
  speed: 1,
  sleep: { kind: 'off' },
  problem: null,
};

/**
 * A player whose state the test sets, watched on a clock the test moves.
 *
 * @returns How to change the player and the clock, and every report made.
 */
const watching = () => {
  let state = IDLE;
  let nowMs = 0;
  const listeners = new Set<() => void>();
  const player: AudiobookPlayer = {
    read: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    open: vi.fn(),
    toggle: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    skip: vi.fn(),
    goToChapter: vi.fn(),
    setSpeed: vi.fn(),
    setSleep: vi.fn(),
    close: vi.fn(),
  };
  const reports: (NowListening | null)[] = [];
  const stop = watchNowListening(
    player,
    (nowListening) => {
      reports.push(nowListening);
    },
    () => nowMs,
  );

  return {
    become: (next: Partial<AudiobookPlayerState>) => {
      state = { ...state, ...next };
      listeners.forEach((listener) => {
        listener();
      });
    },
    wait: (seconds: number) => {
      nowMs += seconds * 1000;
    },
    reports,
    stop,
  };
};

const PLAYING = { book, tracks: TRACKS, durationSeconds: 3600, isPlaying: true };

describe('watchNowListening', () => {
  it('says straight away which book is playing, and from where', () => {
    const { become, reports } = watching();

    become({ ...PLAYING, bookPositionSeconds: 120 });

    expect(reports).toEqual([
      {
        bookId: book.id,
        chapterId: TRACKS[0]?.id,
        positionSeconds: 120,
        durationSeconds: 3600,
        isPlaying: true,
        reportedAtMs: 0,
      },
    ]);
  });

  it('says nothing new while it simply plays on, until a while has passed', () => {
    const { become, wait, reports } = watching();

    become({ ...PLAYING, bookPositionSeconds: 0 });
    wait(5);
    become({ bookPositionSeconds: 5 });
    wait(10);
    become({ bookPositionSeconds: 15 });

    expect(reports).toHaveLength(2);
    expect(reports[1]?.positionSeconds).toBe(15);
  });

  it('says at once when it pauses, moves to another track or jumps', () => {
    const { become, wait, reports } = watching();

    become({ ...PLAYING, bookPositionSeconds: 0 });
    wait(1);
    become({ isPlaying: false, bookPositionSeconds: 1 });
    become({ isPlaying: true, trackAt: 1, bookPositionSeconds: 1800 });
    wait(1);
    become({ bookPositionSeconds: 2400 });

    expect(reports.map((report) => report?.positionSeconds)).toEqual([0, 1, 1800, 2400]);
  });

  it('says it is playing nothing once the book is closed, and only once', () => {
    const { become, reports } = watching();

    become({ ...PLAYING });
    become(IDLE);
    become(IDLE);

    expect(reports.at(-1)).toBeNull();
    expect(reports.filter((report) => report === null)).toHaveLength(1);
  });
});
