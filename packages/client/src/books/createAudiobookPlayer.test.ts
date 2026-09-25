import { describe, expect, it, vi } from 'vitest';
import { chaptersOf, createAudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudiobookTrack, ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';
import type { Book } from '@ValenceContracts/schemas/Book';

const BOOK: Book = {
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001',
  libraryId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0009',
  title: 'Dune',
  layout: 'audio',
  direction: 'leftToRight',
  year: 1965,
  overview: null,
  genres: null,
  authors: ['Frank Herbert'],
  rating: null,
  hasCover: true,
  chapterCount: 2,
  hasText: false,
  hasAudio: true,
  addedAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const TRACKS: AudiobookTrack[] = [
  { id: 'one', title: 'Part one', durationSeconds: 100, marks: [] },
  { id: 'two', title: 'Part two', durationSeconds: 50, marks: [] },
];

const MARKED: AudiobookTrack[] = [
  {
    id: 'whole',
    title: 'Dune',
    durationSeconds: 300,
    marks: [
      { title: 'Opening', startSeconds: 0, endSeconds: 120 },
      { title: 'Arrakis', startSeconds: 120, endSeconds: 300 },
    ],
  },
];

type FakeAudio = ListeningAudio & { fire: (type: string) => void };

/**
 * An audio element that plays nothing, whose events a test fires by hand.
 *
 * @returns The audio.
 */
const aFakeAudio = (): FakeAudio => {
  const listeners = new Map<string, Array<() => void>>();

  return {
    src: '',
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    paused: true,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    addEventListener: (type, listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    fire: (type) => {
      (listeners.get(type) ?? []).forEach((listener) => {
        listener();
      });
    },
  };
};

/**
 * A player over a fake audio element, with the time and what it keeps in the test's hands.
 *
 * @returns The player, its audio, what it kept, and a clock.
 */
const aPlayer = () => {
  const audio = aFakeAudio();
  const save = vi.fn();
  const clock = { ms: 0 };
  const player = createAudiobookPlayer({
    audio,
    addressOf: (bookId, trackId) => `/api/books/${bookId}/chapters/${trackId}/audio`,
    save,
    now: () => clock.ms,
  });

  return { audio, save, clock, player };
};

describe('chaptersOf', () => {
  it('makes a chapter of each track, placed in the whole book', () => {
    expect(chaptersOf(TRACKS)).toEqual([
      { title: 'Part one', trackAt: 0, bookStartSeconds: 0, bookEndSeconds: 100 },
      { title: 'Part two', trackAt: 1, bookStartSeconds: 100, bookEndSeconds: 150 },
    ]);
  });

  it('makes a chapter of each mark a track has inside it', () => {
    expect(chaptersOf(MARKED).map((chapter) => chapter.title)).toEqual(['Opening', 'Arrakis']);
  });
});

describe('createAudiobookPlayer', () => {
  it('opens a book where somebody left off, and plays it', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, TRACKS, { chapterId: 'two', positionSeconds: 20 });
    audio.fire('loadedmetadata');

    expect(audio.src).toBe(`/api/books/${BOOK.id}/chapters/two/audio`);
    expect(audio.currentTime).toBe(20);
    expect(audio.play).toHaveBeenCalled();
    expect(player.read()).toMatchObject({
      trackAt: 1,
      bookPositionSeconds: 120,
      durationSeconds: 150,
      isPlaying: true,
      isLoading: false,
    });
  });

  it('starts from the beginning where nothing is kept', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, TRACKS, null);

    expect(audio.src).toBe(`/api/books/${BOOK.id}/chapters/one/audio`);
    expect(player.read().bookPositionSeconds).toBe(0);
  });

  it('lines up the next track and runs on into it without a gap, where the audio can', () => {
    const { audio, save, player } = aPlayer();
    const lineUp = vi.fn();

    audio.lineUp = lineUp;
    player.open(BOOK, TRACKS, null);
    audio.fire('loadedmetadata');

    expect(lineUp).toHaveBeenLastCalledWith(`/api/books/${BOOK.id}/chapters/two/audio`);

    audio.src = `/api/books/${BOOK.id}/chapters/two/audio`;
    audio.fire('advanced');

    expect(audio.src).toBe(`/api/books/${BOOK.id}/chapters/two/audio`);
    expect(player.read()).toMatchObject({ trackAt: 1, bookPositionSeconds: 100 });
    expect(save).toHaveBeenLastCalledWith(BOOK.id, {
      chapterId: 'two',
      positionSeconds: 0,
      isFinished: false,
    });
    expect(lineUp).toHaveBeenCalledTimes(1);
  });

  it('carries on into the next track, and says the book is finished after the last', () => {
    const { audio, save, player } = aPlayer();

    player.open(BOOK, TRACKS, null);
    audio.fire('loadedmetadata');
    audio.fire('ended');

    expect(audio.src).toBe(`/api/books/${BOOK.id}/chapters/two/audio`);
    expect(player.read().trackAt).toBe(1);

    audio.fire('loadedmetadata');
    audio.fire('ended');

    expect(player.read()).toMatchObject({ isPlaying: false, bookPositionSeconds: 150 });
    expect(save).toHaveBeenLastCalledWith(BOOK.id, {
      chapterId: 'two',
      positionSeconds: 50,
      isFinished: true,
    });
  });

  it('skips across tracks as though the book were one', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, TRACKS, { chapterId: 'one', positionSeconds: 90 });
    audio.fire('loadedmetadata');
    audio.currentTime = 90;
    audio.fire('timeupdate');
    player.skip(30);

    expect(audio.src).toBe(`/api/books/${BOOK.id}/chapters/two/audio`);
    expect(player.read().bookPositionSeconds).toBe(120);

    audio.fire('loadedmetadata');
    player.skip(-15);

    expect(audio.currentTime).toBe(5);
    expect(player.read().bookPositionSeconds).toBe(105);
  });

  it('goes to a chapter marked inside a track, without loading the track again', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, MARKED, null);
    audio.fire('loadedmetadata');
    player.goToChapter(1);

    expect(audio.currentTime).toBe(120);
    expect(player.read().bookPositionSeconds).toBe(120);
  });

  it('keeps where somebody is every so often while it plays, and as it pauses', () => {
    const { audio, save, clock, player } = aPlayer();

    player.open(BOOK, TRACKS, null);
    audio.fire('loadedmetadata');
    audio.fire('playing');
    save.mockClear();

    clock.ms = 5000;
    audio.currentTime = 5;
    audio.fire('timeupdate');

    expect(save).not.toHaveBeenCalled();

    clock.ms = 16_000;
    audio.currentTime = 16;
    audio.fire('timeupdate');

    expect(save).toHaveBeenCalledWith(BOOK.id, {
      chapterId: 'one',
      positionSeconds: 16,
      isFinished: false,
    });

    save.mockClear();
    player.pause();
    audio.fire('pause');

    expect(player.read().isPlaying).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('pauses when somebody pauses it while it is still fetching', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, TRACKS, null);
    audio.fire('loadedmetadata');
    audio.fire('playing');
    audio.fire('waiting');
    player.toggle();
    audio.fire('pause');

    expect(player.read().isPlaying).toBe(false);
  });

  it('plays faster or slower, and keeps the speed into the next book', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, TRACKS, null);
    player.setSpeed(1.5);

    expect(audio.playbackRate).toBe(1.5);

    player.open(BOOK, MARKED, null);

    expect(player.read().speed).toBe(1.5);
    expect(audio.playbackRate).toBe(1.5);
  });

  it('falls asleep after so many minutes', () => {
    const { audio, clock, player } = aPlayer();

    player.open(BOOK, TRACKS, null);
    audio.fire('loadedmetadata');
    player.setSleep(10);
    clock.ms = 10 * 60_000;
    audio.fire('timeupdate');

    expect(audio.pause).toHaveBeenCalled();
    expect(player.read()).toMatchObject({ isPlaying: false, sleep: { kind: 'off' } });
  });

  it('falls asleep at the end of the chapter playing when it was set', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, MARKED, null);
    audio.fire('loadedmetadata');
    player.setSleep('endOfChapter');

    expect(player.read().sleep).toEqual({ kind: 'endOfChapter', atBookSeconds: 120 });

    audio.currentTime = 119;
    audio.fire('timeupdate');

    expect(audio.pause).not.toHaveBeenCalled();

    audio.currentTime = 120;
    audio.fire('timeupdate');

    expect(audio.pause).toHaveBeenCalled();
  });

  it('says a track would not play', () => {
    const { audio, player } = aPlayer();

    player.open(BOOK, TRACKS, null);
    audio.fire('error');

    expect(player.read()).toMatchObject({
      isPlaying: false,
      problem: 'That track would not play.',
    });
  });

  it('keeps where somebody was as it closes, and tells whoever listens', () => {
    const { audio, save, player } = aPlayer();
    const listener = vi.fn();
    const stop = player.subscribe(listener);

    player.open(BOOK, TRACKS, { chapterId: 'one', positionSeconds: 30 });
    save.mockClear();
    player.close();

    expect(save).toHaveBeenCalledWith(BOOK.id, {
      chapterId: 'one',
      positionSeconds: 30,
      isFinished: false,
    });
    expect(audio.src).toBe('');
    expect(player.read().book).toBeNull();
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    stop();
    player.open(BOOK, TRACKS, null);

    expect(listener).not.toHaveBeenCalled();
  });
});
