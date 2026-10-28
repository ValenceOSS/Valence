import type { Range } from '@ValenceCore/functions/findSharedAudio';

type HeldAgainstLimits = {
  enough: number;
  most: number;
};

/**
 * Holds one episode's fingerprint against others in turn, until enough of them share a stretch with
 * it or as many as are worth trying have been tried. Most episodes agree with the first few, so the
 * work is a handful of comparisons each; one whose first few are the odd ones out, such as a special
 * with its own music, is held against more of the season rather than going without. The limit keeps
 * the work in step with the size of the season and never with its square.
 *
 * @param mine - The episode being looked at.
 * @param others - The fingerprints to hold it against, in the order to try them.
 * @param match - Where the episode shares a stretch with another, or null where it shares none.
 * @param limits - How many matches are enough, and how many others to try at most.
 * @returns The stretches found, in the episode's own time.
 */
const heldAgainst = <Print extends { mediaId: string }>(
  mine: Print,
  others: readonly Print[],
  match: (other: Print) => Range | null,
  { enough, most }: HeldAgainstLimits,
): Range[] => {
  const ranges: Range[] = [];
  let tried = 0;

  for (const other of others) {
    if (ranges.length >= enough || tried >= most) {
      break;
    }

    if (other.mediaId === mine.mediaId) {
      continue;
    }

    tried += 1;

    const shared = match(other);

    if (shared !== null) {
      ranges.push(shared);
    }
  }

  return ranges;
};

export { heldAgainst };
