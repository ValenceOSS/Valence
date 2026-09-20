import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import type { ClientFetch } from '@ValenceRequests/downloads/DownloadClientAdapter';

type ClientCall = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
};

const WAIT_SECONDS = 15;

/**
 * Asks a download client something within a fixed time, turning a client that cannot be reached or
 * does not answer into a failure that says so in words.
 *
 * Every question goes on a connection of its own. Clients are asked a few seconds apart at most, so
 * keeping one open saves nothing, and some — NZBGet among them — close a connection Node would
 * otherwise send the next question down, which fails as though the client had gone.
 *
 * @param fetch - How to ask.
 * @param name - What the client is called, for saying so.
 * @param waitSeconds - How long to wait for an answer.
 * @returns How to ask it.
 */
const createClientCaller =
  (fetch: ClientFetch, name: string, waitSeconds = WAIT_SECONDS) =>
  async (url: string, { method = 'GET', headers = {}, body }: ClientCall = {}) => {
    try {
      return await fetch(url, {
        method,
        headers: { ...headers, connection: 'close' },
        ...(body === undefined ? {} : { body }),
        signal: AbortSignal.timeout(waitSeconds * 1000),
      });
    } catch (error) {
      throw new DownloadClientFailure(
        error instanceof Error && error.name === 'TimeoutError'
          ? `${name} did not answer within ${waitSeconds.toString()} seconds`
          : `${name} could not be reached`,
      );
    }
  };

type ClientCaller = ReturnType<typeof createClientCaller>;

export type { ClientCaller };

export { createClientCaller };
