import { open } from 'node:fs/promises';
import { contentTypeOfMedia } from '@ValenceServer/playback/contentTypeOfMedia';
import { parseByteRange } from '@ValenceServer/playback/parseByteRange';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';

const CHUNK_BYTES = 1024 * 1024;

/**
 * Reads a media file straight off the disk for direct play, a mebibyte at a time.
 *
 * Direct play used to ask the media service for the file and pass along what came back, so every
 * byte crossed a socket and three kinds of stream inside this process. On a NAS with a slow
 * processor that cost most of the speed: the media service read a file at 143 MB/s and the server
 * passed it on at 8 MB/s, which a player fetching ahead runs short on. The server and the media
 * service share the library's folders, so the server reads the file itself, in chunks big enough
 * that the work per chunk stops mattering.
 *
 * @param path - The file, as the library knows it.
 * @param range - The `Range` header asked with, if any.
 * @returns The file to send, or null where this process cannot open it, so the media service can
 *   be asked instead, as it must be where it runs on another machine or sees other folders.
 */
const readMediaFile = async (
  path: string,
  range: string | null,
): Promise<TranscoderStreamedFile | null> => {
  const handle = await open(path, 'r').catch(() => null);

  if (handle === null) {
    return null;
  }

  const details = await handle.stat().catch(() => null);

  if (details === null || !details.isFile()) {
    await handle.close();

    return null;
  }

  const length = details.size;
  const asked = range === null ? null : parseByteRange(range, length);
  const start = asked?.start ?? 0;
  const end = asked?.end ?? length - 1;
  let position = start;
  let isClosed = false;

  const close = async () => {
    if (!isClosed) {
      isClosed = true;
      await handle.close().catch(() => undefined);
    }
  };

  const body = new ReadableStream<Uint8Array>({
    pull: async (controller) => {
      const wanted = Math.min(CHUNK_BYTES, end + 1 - position);

      if (wanted <= 0) {
        await close();
        controller.close();

        return;
      }

      const chunk = Buffer.allocUnsafe(wanted);
      const { bytesRead } = await handle.read(chunk, 0, wanted, position);

      if (bytesRead === 0) {
        await close();
        controller.close();

        return;
      }

      position += bytesRead;
      controller.enqueue(chunk.subarray(0, bytesRead));
    },
    cancel: close,
  });

  return {
    body,
    contentType: contentTypeOfMedia(path),
    status: asked === null ? 200 : 206,
    contentRange:
      asked === null ? null : `bytes ${start.toString()}-${end.toString()}/${length.toString()}`,
    contentLength: (end + 1 - start).toString(),
  };
};

export { readMediaFile };
