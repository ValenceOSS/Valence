import { open, stat } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';

const CHUNK_BYTES = 1024 * 1024;

/**
 * Reads the files that make up one piece of a session straight off the disk, one after another, as
 * the single response a player asked for — a segment, or several short ones offered as one.
 *
 * The media service still decides when a segment is ready and which files make it; this only reads
 * them, so a remux's large segments no longer cross the media service's socket and this process's
 * streams on the way to the player, which on a slow processor cost most of their speed.
 *
 * Each file is opened only while it is read, and closed as soon as it is read through, the player
 * goes, or a read fails. Nothing is read ahead of being asked for, which a stream does by default
 * the moment it is made, so a response a player gave up on before it was sent holds nothing open: a handle left for the collector to close takes the server down on a
 * Node that no longer allows it.
 *
 * @param paths - The files, in order.
 * @param contentType - What they are.
 * @returns The response to send, or null where any of them cannot be opened here, so the media
 *   service can be asked for the bytes instead.
 */
const readSessionFiles = async (
  paths: readonly string[],
  contentType: string,
): Promise<TranscoderStreamedFile | null> => {
  const sizes: number[] = [];

  for (const path of paths) {
    const details = await stat(path).catch(() => null);

    if (details === null || !details.isFile()) {
      return null;
    }

    sizes.push(details.size);
  }

  const reading: { at: number; position: number; handle: FileHandle | null } = {
    at: 0,
    position: 0,
    handle: null,
  };

  const letGo = async () => {
    const { handle } = reading;

    reading.handle = null;
    await handle?.close().catch(() => undefined);
  };

  const body = new ReadableStream<Uint8Array>(
    {
      pull: async (controller) => {
        try {
          for (let path = paths[reading.at]; path !== undefined; path = paths[reading.at]) {
            reading.handle ??= await open(path, 'r');

            const chunk = Buffer.allocUnsafe(CHUNK_BYTES);
            const { bytesRead } = await reading.handle.read(
              chunk,
              0,
              CHUNK_BYTES,
              reading.position,
            );

            if (bytesRead > 0) {
              reading.position += bytesRead;
              controller.enqueue(chunk.subarray(0, bytesRead));

              return;
            }

            await letGo();
            reading.at += 1;
            reading.position = 0;
          }

          controller.close();
        } catch (error) {
          await letGo();
          controller.error(error);
        }
      },
      cancel: letGo,
    },
    { highWaterMark: 0 },
  );

  return {
    body,
    contentType,
    status: 200,
    contentRange: null,
    contentLength: sizes.reduce((total, size) => total + size, 0).toString(),
  };
};

export { readSessionFiles };
