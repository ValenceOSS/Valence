import type { NowListening } from '@ValenceContracts/schemas/BookRemote';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

const REPORTS_EVERY_MS = 15_000;

const JUMPED_SECONDS = 5;

/**
 * Keeps the server told what this device is listening to, as the audiobook player moves.
 *
 * Every change worth knowing is said straight away — a book opened or closed, a new track, playing
 * or pausing, a jump through the book — and otherwise where it has got to is said every so often
 * while it plays, which is how often an administrator's view of it can be out.
 *
 * @param player - The audiobook player.
 * @param report - How to tell the server, given what is playing or nothing.
 * @param now - The clock.
 * @returns A way to stop.
 */
const watchNowListening = (
  player: AudiobookPlayer,
  report: (nowListening: NowListening | null) => void,
  now: () => number,
): (() => void) => {
  let last: NowListening | null = null;

  return player.subscribe(() => {
    const state = player.read();
    const track = state.tracks[state.trackAt];

    if (state.book === null || track === undefined) {
      if (last !== null) {
        last = null;
        report(null);
      }

      return;
    }

    const atMs = now();
    const expected =
      last === null
        ? null
        : last.positionSeconds +
          (last.isPlaying ? ((atMs - last.reportedAtMs) / 1000) * state.speed : 0);
    const isNews =
      last === null ||
      expected === null ||
      last.bookId !== state.book.id ||
      last.chapterId !== track.id ||
      last.isPlaying !== state.isPlaying ||
      Math.abs(state.bookPositionSeconds - expected) > JUMPED_SECONDS ||
      atMs - last.reportedAtMs >= REPORTS_EVERY_MS;

    if (!isNews) {
      return;
    }

    last = {
      bookId: state.book.id,
      chapterId: track.id,
      positionSeconds: state.bookPositionSeconds,
      durationSeconds: state.durationSeconds,
      isPlaying: state.isPlaying,
      reportedAtMs: atMs,
    };
    report(last);
  });
};

export { watchNowListening };
