const COUNTS_FROM_BYTES = 256 * 1024;

const WEIGHT_OF_THE_NEWEST = 0.3;

/**
 * Measures how fast the connection delivers the film, by counting the bytes of every response the
 * browser's own player fetches as they arrive. Only responses large enough to say something about
 * the connection count, and each new one moves the estimate part of the way, so one slow request
 * does not drop the quality on its own.
 *
 * @param fetcher - How requests are sent.
 * @returns The fetch to give the player, and the latest estimate in kilobits a second.
 */
const createThroughputMeter = (
  fetcher: typeof fetch = (input, init) => fetch(input, init),
): { fetchFn: typeof fetch; readKbps: () => number | null } => {
  const state: { kbps: number | null } = { kbps: null };

  const note = (bytes: number, seconds: number) => {
    if (bytes < COUNTS_FROM_BYTES || seconds <= 0) {
      return;
    }

    const kbps = (bytes * 8) / seconds / 1000;

    state.kbps =
      state.kbps === null ? kbps : state.kbps + (kbps - state.kbps) * WEIGHT_OF_THE_NEWEST;
  };

  return {
    fetchFn: async (input, init) => {
      const response = await fetcher(input, init);

      if (response.body === null) {
        return response;
      }

      const started = performance.now();
      let bytes = 0;
      const counted = response.body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform: (chunk, controller) => {
            bytes += chunk.byteLength;
            controller.enqueue(chunk);
          },
          flush: () => {
            note(bytes, (performance.now() - started) / 1000);
          },
        }),
      );

      return new Response(counted, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },

    readKbps: () => (state.kbps === null ? null : Math.round(state.kbps)),
  };
};

export { createThroughputMeter };
