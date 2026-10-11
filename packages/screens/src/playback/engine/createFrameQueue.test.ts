import { describe, expect, it, vi } from 'vitest';
import { createFrameQueue } from '@ValenceScreens/playback/engine/createFrameQueue';

type Frame = { timestamp: number; close: () => void; isClosed: boolean };

/**
 * A decoder of a picture with a frame every tenth of a second, recording where it was asked to
 * start and which frames were closed.
 *
 * @param last - The last frame's time.
 * @returns The sink, and what it has been asked.
 */
const aSink = (last = 10) => {
  const startedAt: number[] = [];
  const made: Frame[] = [];

  return {
    startedAt,
    made,
    sink: {
      samples: async function* (from: number) {
        startedAt.push(from);

        for (
          let at = Math.floor(from * 10) / 10;
          at <= last;
          at = Math.round((at + 0.1) * 10) / 10
        ) {
          const frame: Frame = {
            timestamp: at,
            isClosed: false,
            close: () => {
              frame.isClosed = true;
            },
          };

          made.push(frame);
          yield await Promise.resolve(frame);
        }
      },
    },
  };
};

/**
 * Lets the decoder run as far as it will.
 */
const settle = async () => {
  for (let turn = 0; turn < 20; turn += 1) {
    await Promise.resolve();
  }
};

describe('createFrameQueue', () => {
  it('decodes only a few frames ahead of what has been taken', async () => {
    const { sink, made } = aSink();
    const queue = createFrameQueue(sink, vi.fn());

    queue.startAt(0);
    await settle();

    expect(made).toHaveLength(4);
    expect(queue.reaches()).toBe(0.3);
  });

  it('hands over the newest frame due and closes the ones it skipped', async () => {
    const { sink, made } = aSink();
    const queue = createFrameQueue(sink, vi.fn());

    queue.startAt(0);
    await settle();

    const taken = queue.take(0.25);

    expect(taken?.timestamp).toBe(0.2);
    expect(made.slice(0, 2).every((frame) => frame.isClosed)).toBe(true);
    expect(taken?.close).toBeDefined();
  });

  it('hands over nothing before the first frame is due', async () => {
    const { sink } = aSink();
    const queue = createFrameQueue(sink, vi.fn());

    queue.startAt(1);
    await settle();

    expect(queue.take(0.5)).toBeNull();
  });

  it('shows the newest frame it has but starts again at the clock when it has fallen far behind', async () => {
    const { sink, startedAt } = aSink();
    const queue = createFrameQueue(sink, vi.fn());

    queue.startAt(0);
    await settle();
    queue.take(0.3);
    await settle();
    queue.take(0.7);
    await settle();

    expect(queue.take(5)?.timestamp).toBe(1.1);
    expect(startedAt).toEqual([0, 5]);
  });

  it('drops what it held when started somewhere else', async () => {
    const { sink, made } = aSink();
    const queue = createFrameQueue(sink, vi.fn());

    queue.startAt(0);
    await settle();
    queue.startAt(8);
    await settle();

    expect(made.slice(0, 4).every((frame) => frame.isClosed)).toBe(true);
    expect(queue.reaches()).toBe(8.3);
  });

  it('says a decoder that fails, once', async () => {
    const onFault = vi.fn();
    const queue = createFrameQueue(
      {
        samples: async function* (): AsyncGenerator<Frame> {
          yield* [];
          await Promise.reject(new Error('the decoder broke'));
        },
      },
      onFault,
    );

    queue.startAt(0);
    await settle();

    expect(onFault).toHaveBeenCalledTimes(1);
  });

  it('closes everything it held when stopped', async () => {
    const { sink, made } = aSink();
    const queue = createFrameQueue(sink, vi.fn());

    queue.startAt(0);
    await settle();
    queue.stop();

    expect(made.every((frame) => frame.isClosed)).toBe(true);
    expect(queue.reaches()).toBeNull();
  });
});
