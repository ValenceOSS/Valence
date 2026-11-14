import type { MiddlewareHandler } from 'hono';

const SHORTEST_GAP_MS = 500;

type StreamMeter = {
  count: MiddlewareHandler;
  sample: (nowMs: number) => void;
  bytesPerSecond: () => number | null;
};

/**
 * Counts the bytes this server sends in answer to the requests it is put in front of, and how fast.
 *
 * @returns The middleware that counts, what to call on a steady clock to measure the speed since the
 * last call, and the speed it last measured, or nothing before two calls.
 */
const createStreamMeter = (): StreamMeter => {
  let sent = 0;
  let mark: { atMs: number; sent: number } | null = null;
  let rate: number | null = null;

  const count: MiddlewareHandler = async (context, next) => {
    await next();

    const body = context.res.body;

    if (context.req.method !== 'GET' || !context.res.ok || body === null) {
      return;
    }

    context.res = new Response(
      body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform: (chunk, controller) => {
            sent += chunk.byteLength;
            controller.enqueue(chunk);
          },
        }),
      ),
      context.res,
    );
  };

  const sample = (nowMs: number): void => {
    if (mark === null) {
      mark = { atMs: nowMs, sent };

      return;
    }

    const elapsedMs = nowMs - mark.atMs;

    if (elapsedMs < SHORTEST_GAP_MS) {
      return;
    }

    rate = Math.round(((sent - mark.sent) * 1000) / elapsedMs);
    mark = { atMs: nowMs, sent };
  };

  return { count, sample, bytesPerSecond: () => rate };
};

export type { StreamMeter };

export { createStreamMeter };
