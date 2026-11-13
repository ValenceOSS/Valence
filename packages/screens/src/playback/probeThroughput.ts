import { createThroughputMeter } from '@ValenceScreens/playback/engine/createThroughputMeter';

const PROBE_BYTES = 4 * 1024 * 1024;

const PROBE_EVERY_MILLISECONDS = 4000;

/**
 * Measures the connection while a file plays directly, where the browser's own player fetches it
 * and tells the page nothing: every few seconds it reads a slice of the same file, uncached, and
 * times how fast the bytes arrive. A server that ignores the range and starts sending the whole file
 * is cut off at once rather than read. It costs a little bandwidth, so it runs only while somebody is
 * looking at the figure.
 *
 * @param url - The file being played.
 * @param fetcher - How requests are sent.
 * @returns How to stop, and the latest estimate in kilobits a second.
 */
const probeThroughput = (
  url: string,
  fetcher: typeof fetch = (input, init) => fetch(input, init),
): { stop: () => void; readKbps: () => number | null } => {
  const meter = createThroughputMeter(fetcher);
  const state = { isStopped: false, isReading: false, aborts: new AbortController() };

  const read = async () => {
    if (state.isStopped || state.isReading) {
      return;
    }

    state.isReading = true;

    try {
      const response = await meter.fetchFn(url, {
        headers: { Range: `bytes=0-${(PROBE_BYTES - 1).toString()}` },
        cache: 'no-store',
        credentials: 'include',
        signal: state.aborts.signal,
      });

      if (response.status !== 206) {
        await response.body?.cancel();

        return;
      }

      await response.arrayBuffer();
    } catch {
      return;
    } finally {
      state.isReading = false;
    }
  };

  void read();

  const timer = setInterval(() => {
    void read();
  }, PROBE_EVERY_MILLISECONDS);

  return {
    stop: () => {
      state.isStopped = true;
      clearInterval(timer);
      state.aborts.abort();
    },
    readKbps: meter.readKbps,
  };
};

export { probeThroughput };
