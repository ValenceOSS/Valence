import type { MiddlewareHandler } from 'hono';

const SHORTEST_GAP_MS = 500;

type StreamMeter = {
  count: MiddlewareHandler;
  bytesPerSecond: (nowMs: number) => number | null;
};

/**
 * Counts the bytes this server sends in answer to the requests it is put in front of, and how fast.
 *
 * @returns The middleware that counts, and the speed since it was last asked, or nothing on the first
 * asking.
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

  const bytesPerSecond = (nowMs: number): number | null => {
    if (mark === null) {
      mark = { atMs: nowMs, sent };

      return null;
    }

    const elapsedMs = nowMs - mark.atMs;

    if (elapsedMs < SHORTEST_GAP_MS) {
      return rate;
    }

    rate = Math.round(((sent - mark.sent) * 1000) / elapsedMs);
    mark = { atMs: nowMs, sent };

    return rate;
  };

  return { count, bytesPerSecond };
};

export type { StreamMeter };

export { createStreamMeter };
