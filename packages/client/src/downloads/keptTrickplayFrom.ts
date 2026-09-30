import { parseTrickplayIndex } from '@ValenceClient/playback/fetchTrickplay';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

/**
 * Reads the thumbnails a download keeps beside itself, with each sheet found beside the index on
 * this device rather than on the server.
 *
 * @param vtt - The index as it was kept.
 * @param indexUrl - Where the kept index is, which its sheets sit next to.
 * @returns The thumbnails, or null where the index holds none.
 */
const keptTrickplayFrom = (vtt: string, indexUrl: string): Trickplay | null => {
  const thumbnails = parseTrickplayIndex(vtt, indexUrl);
  const first = thumbnails[0];

  return first === undefined ? null : { thumbnails, width: first.width, height: first.height };
};

export { keptTrickplayFrom };
