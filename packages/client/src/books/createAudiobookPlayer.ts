import type { Book, ChapterMark } from '@ValenceContracts/schemas/Book';

type ListeningAudio = {
  src: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
  paused: boolean;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (type: string, listener: () => void) => void;
  lineUp?: (src: string) => void;
};

type AudiobookTrack = {
  id: string;
  title: string;
  durationSeconds: number;
  marks: readonly ChapterMark[];
};

type AudiobookChapter = {
  title: string;
  trackAt: number;
  bookStartSeconds: number;
  bookEndSeconds: number;
};

type SleepTimer =
  | { kind: 'off' }
  | { kind: 'after'; endsAtMs: number }
  | { kind: 'endOfChapter'; atBookSeconds: number };

type AudiobookPlayerState = {
  book: Book | null;
  tracks: readonly AudiobookTrack[];
  chapters: readonly AudiobookChapter[];
  trackAt: number;
  bookPositionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  isLoading: boolean;
  speed: number;
  sleep: SleepTimer;
  problem: string | null;
};

type ListeningPlace = { chapterId: string; positionSeconds: number; isFinished: boolean };

type AudiobookPlayerDeps = {
  audio: ListeningAudio;
  addressOf: (bookId: string, trackId: string) => string;
  save: (bookId: string, place: ListeningPlace) => void;
  now: () => number;
  savesEveryMs?: number;
};

type AudiobookPlayer = {
  read: () => AudiobookPlayerState;
  subscribe: (listener: () => void) => () => void;
  open: (
    book: Book,
    tracks: readonly AudiobookTrack[],
    from?: { chapterId: string; positionSeconds: number } | null,
  ) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  seek: (bookSeconds: number) => void;
  skip: (seconds: number) => void;
  goToChapter: (at: number) => void;
  setSpeed: (speed: number) => void;
  setSleep: (choice: 'off' | 'endOfChapter' | number) => void;
  close: () => void;
};

const SAVES_EVERY_MS = 15_000;

const COULD_NOT_PLAY = 'That track would not play.';

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
 * The chapters an audiobook is listened to by: the ones an m4b marks inside itself where it marks
 * them, and otherwise one a track, each placed in the whole book so moving between them is moving
 * through the book.
 *
 * @param tracks - The book's tracks, in order.
 * @returns Its chapters, in order.
 */
const chaptersOf = (tracks: readonly AudiobookTrack[]): AudiobookChapter[] => {
  let before = 0;

  return tracks.flatMap((track, trackAt) => {
    const starts = before;

    before += track.durationSeconds;

    return track.marks.length === 0
      ? [
          {
            title: track.title,
            trackAt,
            bookStartSeconds: starts,
            bookEndSeconds: starts + track.durationSeconds,
          },
        ]
      : track.marks.map((mark) => ({
          title: mark.title,
          trackAt,
          bookStartSeconds: starts + mark.startSeconds,
          bookEndSeconds: starts + mark.endSeconds,
        }));
  });
};

/**
 * Where in the whole book a track starts.
 *
 * @param tracks - The book's tracks, in order.
 * @param trackAt - Which track.
 * @returns How far into the book it starts, in seconds.
 */
const startOf = (tracks: readonly AudiobookTrack[], trackAt: number): number =>
  tracks.slice(0, trackAt).reduce((all, track) => all + track.durationSeconds, 0);

/**
 * The one audiobook player a client has: a book, the audio its tracks play through, and where the
 * listener has got to in it, reckoned across the whole book rather than a track at a time, so a
 * skip or a chapter lands wherever it falls, even in the next track.
 *
 * It carries on from one track into the next, without a gap where the audio can take the next one
 * ahead of time, and says a book is finished only once its last track ends. Where somebody is is kept every few seconds while it plays, and straight away as it pauses,
 * moves, changes track or closes, so another device carries on from the same moment. A sleep timer
 * pauses it after so many minutes, or at the end of the chapter playing when it was set.
 *
 * Everything it touches is handed to it — the audio, where a track streams from, how a place is
 * kept, and the time — so a browser, a television and a phone each give it their own.
 *
 * @param deps - The audio, where tracks stream from, how a place is kept, and the time.
 * @returns The player.
 */
const createAudiobookPlayer = ({
  audio,
  addressOf,
  save,
  now,
  savesEveryMs = SAVES_EVERY_MS,
}: AudiobookPlayerDeps): AudiobookPlayer => {
  const listeners = new Set<() => void>();
  let state: AudiobookPlayerState = IDLE;
  let resumeAt: number | null = null;
  let isSwitching = false;
  let savedAtMs = 0;
  let linedUp = '';

  const change = (next: Partial<AudiobookPlayerState>): void => {
    state = { ...state, ...next };
    listeners.forEach((listener) => {
      listener();
    });
  };

  const keep = (isFinished = false): void => {
    const track = state.tracks[state.trackAt];

    if (state.book === null || track === undefined) {
      return;
    }

    savedAtMs = now();
    save(state.book.id, {
      chapterId: track.id,
      positionSeconds: Math.max(
        state.bookPositionSeconds - startOf(state.tracks, state.trackAt),
        0,
      ),
      isFinished,
    });
  };

  const lineUpNext = (): void => {
    const following = state.tracks[state.trackAt + 1];
    const src =
      state.book === null || following === undefined ? '' : addressOf(state.book.id, following.id);

    if (audio.lineUp !== undefined && src !== linedUp) {
      linedUp = src;
      audio.lineUp(src);
    }
  };

  const load = (trackAt: number, positionSeconds: number, isPlaying: boolean): void => {
    const track = state.tracks[trackAt];

    if (state.book === null || track === undefined) {
      return;
    }

    resumeAt = positionSeconds;
    isSwitching = true;
    change({
      trackAt,
      bookPositionSeconds: startOf(state.tracks, trackAt) + positionSeconds,
      isLoading: true,
      isPlaying,
      problem: null,
    });
    linedUp = '';
    audio.src = addressOf(state.book.id, track.id);
    audio.playbackRate = state.speed;
    lineUpNext();

    if (isPlaying) {
      audio.play().catch(() => {
        change({ isPlaying: false });
      });
    }
  };

  const seekWithin = (bookSeconds: number): void => {
    const clamped = Math.min(Math.max(bookSeconds, 0), state.durationSeconds);
    let trackAt = 0;

    while (trackAt < state.tracks.length - 1 && clamped >= startOf(state.tracks, trackAt + 1)) {
      trackAt += 1;
    }

    const within = clamped - startOf(state.tracks, trackAt);

    if (trackAt === state.trackAt && !isSwitching) {
      audio.currentTime = within;
      change({ bookPositionSeconds: clamped });
    } else {
      load(trackAt, within, state.isPlaying);
    }

    keep();
  };

  const chapterAt = (bookSeconds: number): AudiobookChapter | undefined =>
    state.chapters.findLast((chapter) => chapter.bookStartSeconds <= bookSeconds) ??
    state.chapters[0];

  const sleepNow = (): void => {
    audio.pause();
    change({ isPlaying: false, sleep: { kind: 'off' } });
    keep();
  };

  audio.addEventListener('loadedmetadata', () => {
    if (resumeAt !== null) {
      audio.currentTime = resumeAt;
      resumeAt = null;
    }

    isSwitching = false;
    change({ isLoading: false });
  });

  audio.addEventListener('timeupdate', () => {
    if (state.book === null || isSwitching) {
      return;
    }

    const bookPositionSeconds = startOf(state.tracks, state.trackAt) + audio.currentTime;

    change({ bookPositionSeconds });

    const { sleep } = state;

    if (
      (sleep.kind === 'after' && now() >= sleep.endsAtMs) ||
      (sleep.kind === 'endOfChapter' && bookPositionSeconds >= sleep.atBookSeconds)
    ) {
      sleepNow();

      return;
    }

    if (state.isPlaying && now() - savedAtMs >= savesEveryMs) {
      keep();
    }
  });

  audio.addEventListener('playing', () => {
    change({ isPlaying: true, isLoading: false });
  });

  audio.addEventListener('pause', () => {
    if (state.isPlaying && !isSwitching) {
      change({ isPlaying: false });
      keep();
    }
  });

  audio.addEventListener('waiting', () => {
    change({ isLoading: true });
  });

  audio.addEventListener('canplay', () => {
    change({ isLoading: false });
  });

  const runOn = (): void => {
    if (state.trackAt < state.tracks.length - 1) {
      load(state.trackAt + 1, 0, true);
      keep();

      return;
    }

    change({ isPlaying: false, bookPositionSeconds: state.durationSeconds });
    keep(true);
  };

  audio.addEventListener('advanced', () => {
    const trackAt = state.trackAt + 1;

    if (linedUp === '' || state.tracks[trackAt] === undefined || audio.src !== linedUp) {
      linedUp = '';
      runOn();

      return;
    }

    linedUp = '';
    change({
      trackAt,
      bookPositionSeconds: startOf(state.tracks, trackAt),
      isLoading: false,
      problem: null,
    });
    keep();
    lineUpNext();
  });

  audio.addEventListener('ended', runOn);

  audio.addEventListener('error', () => {
    if (state.book !== null && audio.src !== '') {
      change({ isPlaying: false, isLoading: false, problem: COULD_NOT_PLAY });
    }
  });

  return {
    read: () => state,

    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    open: (book, tracks, from) => {
      if (state.book !== null) {
        keep();
      }

      const trackAt = Math.max(
        from === null || from === undefined
          ? 0
          : tracks.findIndex((track) => track.id === from.chapterId),
        0,
      );

      change({
        ...IDLE,
        speed: state.speed,
        book,
        tracks,
        chapters: chaptersOf(tracks),
        durationSeconds: tracks.reduce((all, track) => all + track.durationSeconds, 0),
      });
      load(
        trackAt,
        from?.chapterId === tracks[trackAt]?.id ? (from?.positionSeconds ?? 0) : 0,
        true,
      );
    },

    toggle: () => {
      if (state.isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {
          change({ isPlaying: false });
        });
        change({ isPlaying: true });
      }
    },

    play: () => {
      if (!state.isPlaying && state.book !== null) {
        audio.play().catch(() => {
          change({ isPlaying: false });
        });
        change({ isPlaying: true });
      }
    },

    pause: () => {
      if (state.isPlaying) {
        audio.pause();
      }
    },

    seek: seekWithin,

    skip: (seconds) => {
      seekWithin(state.bookPositionSeconds + seconds);
    },

    goToChapter: (at) => {
      const chapter = state.chapters[at];

      if (chapter !== undefined) {
        seekWithin(chapter.bookStartSeconds);
      }
    },

    setSpeed: (speed) => {
      audio.playbackRate = speed;
      change({ speed });
    },

    setSleep: (choice) => {
      if (choice === 'off') {
        change({ sleep: { kind: 'off' } });

        return;
      }

      if (choice === 'endOfChapter') {
        const chapter = chapterAt(state.bookPositionSeconds);

        change({
          sleep:
            chapter === undefined
              ? { kind: 'off' }
              : { kind: 'endOfChapter', atBookSeconds: chapter.bookEndSeconds },
        });

        return;
      }

      change({ sleep: { kind: 'after', endsAtMs: now() + choice * 60_000 } });
    },

    close: () => {
      keep();
      audio.pause();
      linedUp = '';
      audio.src = '';
      resumeAt = null;
      isSwitching = false;
      change({ ...IDLE, speed: state.speed });
    },
  };
};

export type {
  AudiobookChapter,
  AudiobookPlayer,
  AudiobookPlayerDeps,
  AudiobookPlayerState,
  AudiobookTrack,
  ListeningAudio,
  ListeningPlace,
  SleepTimer,
};

export { chaptersOf, createAudiobookPlayer };
