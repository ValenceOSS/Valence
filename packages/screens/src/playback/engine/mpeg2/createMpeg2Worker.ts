import { z } from 'zod';
import type { DecodedPictures } from '@ValenceScreens/playback/engine/loadBrowserDecoders';

const AnswerSchema = z.object({
  id: z.number(),
  frames: z.instanceof(ArrayBuffer),
  count: z.number(),
  width: z.number(),
  height: z.number(),
});

type Mpeg2Worker = {
  decode: (stream: Uint8Array) => Promise<DecodedPictures>;
  reset: () => void;
  stop: () => void;
};

/**
 * Runs the MPEG-2 decoder in a worker of its own, so decoding a group of pictures — a fifth of a
 * second of work every half second — never holds up the page drawing the frames already decoded.
 * Streams go to the worker and frames come back without a copy.
 *
 * @returns The worker's decoder, and how to start it afresh or stop it.
 */
const createMpeg2Worker = (): Mpeg2Worker => {
  const worker = new Worker(new URL('./mpeg2Worker.ts', import.meta.url), { type: 'module' });
  const waiting = new Map<number, (decoded: DecodedPictures) => void>();
  const state = { next: 0 };

  worker.addEventListener('message', (event) => {
    const answer = AnswerSchema.safeParse(event.data);

    if (answer.success) {
      waiting.get(answer.data.id)?.({
        frames: new Uint8Array(answer.data.frames),
        count: answer.data.count,
        width: answer.data.width,
        height: answer.data.height,
      });
      waiting.delete(answer.data.id);
    }
  });

  return {
    decode: (stream) =>
      new Promise((resolve) => {
        const id = state.next;
        const copy = stream.slice().buffer;

        state.next += 1;
        waiting.set(id, resolve);
        worker.postMessage({ kind: 'decode', id, stream: copy }, [copy]);
      }),

    reset: () => {
      worker.postMessage({ kind: 'reset' });
    },

    stop: () => {
      worker.terminate();

      for (const resolve of waiting.values()) {
        resolve({ frames: new Uint8Array(), count: 0, width: 0, height: 0 });
      }

      waiting.clear();
    },
  };
};

export type { Mpeg2Worker };

export { createMpeg2Worker };
