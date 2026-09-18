import type { LyricLine } from '@ValenceContracts/schemas/Music';

/**
 * Which line of synced lyrics is being sung at a moment: the last one whose time has come.
 *
 * @param lines - The lines, in the order they are sung.
 * @param atMs - Where the song is.
 * @returns The line's index, or -1 before the first is sung or where the lyrics are not synced.
 */
const lyricLineAt = (lines: readonly LyricLine[], atMs: number): number => {
  let found = -1;

  for (const [index, line] of lines.entries()) {
    if (line.atMs === null || line.atMs > atMs) {
      break;
    }

    found = index;
  }

  return found;
};

export { lyricLineAt };
