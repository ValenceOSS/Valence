import { open } from 'node:fs/promises';
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
 * @param paths - The files, in order.
 * @param contentType - What they are.
 * @returns The response to send, or null where any of them cannot be opened here, so the media
 *   service can be asked for the bytes instead.
 */
const readSessionFiles = async (
  paths: readonly string[],
  contentType: string,
): Promise<TranscoderStreamedFile | null> => {
  const handles: FileHandle[] = [];
  const sizes: number[] = [];

  const closeAll = async () => {
    await Promise.all(handles.map((handle) => handle.close().catch(() => undefined)));
  };

  for (const path of paths) {
    const handle = await open(path, 'r').catch(() => null);
    const details = handle === null ? null : await handle.stat().catch(() => null);

    if (handle !== null) {
      handles.push(handle);
    }

    if (details === null || !details.isFile()) {
      await closeAll();

      return null;
    }

    sizes.push(details.size);
  }

  let at = 0;
  let position = 0;

  const body = new ReadableStream<Uint8Array>({
    pull: async (controller) => {
      for (let handle = handles[at]; handle !== undefined; handle = handles[at]) {
        const chunk = Buffer.allocUnsafe(CHUNK_BYTES);
        const { bytesRead } = await handle.read(chunk, 0, CHUNK_BYTES, position);

        if (bytesRead > 0) {
          position += bytesRead;
          controller.enqueue(chunk.subarray(0, bytesRead));

          return;
        }

        at += 1;
        position = 0;
      }

      await closeAll();
      controller.close();
    },
    cancel: closeAll,
  });

  return {
    body,
    contentType,
    status: 200,
    contentRange: null,
    contentLength: sizes.reduce((total, size) => total + size, 0).toString(),
  };
};

export { readSessionFiles };
