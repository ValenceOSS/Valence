const HELD_AHEAD = 4;

const FALLEN_BEHIND_SECONDS = 2;

type Frame = { timestamp: number; close: () => void };

type FrameQueue<Sample extends Frame> = {
  startAt: (seconds: number) => void;
  take: (seconds: number) => Sample | null;
  reaches: () => number | null;
  counts: () => { decoded: number; skipped: number };
  stop: () => void;
};

/**
 * Keeps a few decoded frames ready ahead of the clock, counting how many it decoded and how many it
 * had to skip because the clock had already passed them, decoding more only as the earlier ones are
 * taken, so a hardware decoder is never asked for more surfaces than it has and a long film never
 * piles up in memory.
 *
 * Starting again somewhere else drops what was held and decodes from the key frame before that
 * point. A decoder that falls more than two seconds behind the clock starts again at the clock
 * rather than racing through every frame it missed.
 *
 * @param sink - Where decoded frames come from, in presentation order from a given time.
 * @param onFault - Told that decoding failed.
 * @param heldAhead - How many frames to keep ready: few for a hardware decoder's scarce surfaces,
 *   more for frames decoded in the page, a group of pictures at a time.
 * @returns The queue.
 */
const createFrameQueue = <Sample extends Frame>(
  sink: { samples: (startTimestamp: number) => AsyncIterable<Sample> },
  onFault: () => void,
  heldAhead = HELD_AHEAD,
): FrameQueue<Sample> => {
  const state: {
    run: number;
    held: Sample[];
    wake: (() => void) | null;
    produced: number | null;
    decoded: number;
    skipped: number;
  } = { run: 0, held: [], wake: null, produced: null, decoded: 0, skipped: 0 };

  const drop = () => {
    for (const sample of state.held) {
      sample.close();
    }

    state.held = [];
    state.produced = null;
    state.wake?.();
    state.wake = null;
  };

  const decodeFrom = async (seconds: number, run: number) => {
    const isCurrent = () => run === state.run;

    try {
      for await (const sample of sink.samples(seconds)) {
        if (!isCurrent()) {
          sample.close();

          return;
        }

        state.held.push(sample);
        state.produced = sample.timestamp;
        state.decoded += 1;

        while (isCurrent() && state.held.length >= heldAhead) {
          await new Promise<void>((resolve) => {
            state.wake = resolve;
          });
        }

        if (!isCurrent()) {
          return;
        }
      }
    } catch {
      if (isCurrent()) {
        onFault();
      }
    }
  };

  const startAt = (seconds: number) => {
    state.run += 1;
    drop();
    void decodeFrom(Math.max(0, seconds), state.run);
  };

  return {
    startAt,

    take: (seconds) => {
      const due = state.held.filter((sample) => sample.timestamp <= seconds);
      const newest = due.at(-1) ?? null;

      for (const sample of due.slice(0, -1)) {
        sample.close();
        state.skipped += 1;
      }

      state.held = state.held.filter((sample) => sample.timestamp > seconds);

      const reached = state.held.at(-1)?.timestamp ?? state.produced;

      if (reached !== null && reached < seconds - FALLEN_BEHIND_SECONDS) {
        startAt(seconds);
      } else {
        state.wake?.();
        state.wake = null;
      }

      return newest;
    },

    reaches: () => state.held.at(-1)?.timestamp ?? null,

    counts: () => ({ decoded: state.decoded, skipped: state.skipped }),

    stop: () => {
      state.run += 1;
      drop();
    },
  };
};

export type { FrameQueue };

export { createFrameQueue };
