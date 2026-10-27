import type { IncomingMessage } from 'node:http';
import { openPinnedRequest } from '@ValenceCore/network/openPinnedRequest';
import type { OpenPinnedRequestOptions } from '@ValenceCore/network/openPinnedRequest';
import { contentTypeOfMedia } from '@ValenceServer/playback/contentTypeOfMedia';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';

type Fetched = { url: string; hosts: readonly string[]; fileName: string | null };

const EXPIRED = new Set([401, 403, 404, 410]);

/**
 * A Node response body as the web stream a route hands on, read only as fast as it is taken.
 *
 * @param incoming - The response.
 * @returns The stream.
 */
const webStreamOf = (incoming: IncomingMessage): ReadableStream<Uint8Array> => {
  const chunks = incoming[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>(
    {
      pull: async (controller) => {
        try {
          const next = await chunks.next();

          if (next.done === true) {
            controller.close();

            return;
          }

          const chunk: Buffer = Buffer.isBuffer(next.value) ? next.value : Buffer.alloc(0);

          controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
        } catch (error) {
          controller.error(error);
        }
      },
      cancel: () => {
        incoming.destroy();
      },
    },
    { highWaterMark: 0 },
  );
};

/**
 * Reads a streamed film's file, or the range of it asked for, straight from wherever its source
 * keeps it — the way a device that plays the file as it is reaches it, since the device only ever
 * talks to this server. The fetch is held to the hosts the source's plugin listed, every address
 * public. A link that no longer works answers `expired` rather than a file, so the caller can ask
 * for a fresh one.
 *
 * @param fetched - Where the file is now, and the hosts it may come from.
 * @param range - The range asked for, where one was.
 * @param options - The seams a test or a developer's machine needs.
 * @returns The file, `expired`, or null where the source would not give it up.
 */
const readRemoteFile = async (
  fetched: Fetched,
  range: string | null,
  options: Pick<
    OpenPinnedRequestOptions,
    'devHosts' | 'transport' | 'resolver' | 'isAllowedAddress'
  > = {},
): Promise<TranscoderStreamedFile | 'expired' | null> => {
  const answer = await openPinnedRequest(
    fetched.url,
    range === null ? {} : { headers: { range } },
    { hosts: fetched.hosts, userAgent: 'Valence', idleMilliseconds: 60_000, ...options },
  );

  if (EXPIRED.has(answer.status)) {
    answer.body.resume();

    return 'expired';
  }

  if (answer.status !== 200 && answer.status !== 206) {
    answer.body.resume();

    return null;
  }

  return {
    body: webStreamOf(answer.body),
    contentType: contentTypeOfMedia(fetched.fileName ?? fetched.url),
    status: answer.status,
    contentRange: answer.headers['content-range'] ?? null,
    contentLength: answer.headers['content-length'] ?? null,
  };
};

export { readRemoteFile };
