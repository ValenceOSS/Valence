import { z } from 'zod';
import { findSharedAudio } from '@ValenceCore/functions/findSharedAudio';
import { heldAgainst } from './heldAgainst';
import type { Range } from '@ValenceCore/functions/findSharedAudio';

const HeardEpisodeSchema = z.object({
  mediaId: z.string(),
  hashes: z.array(z.number()),
  framesPerSecond: z.number(),
});

const SeasonToMatchSchema = z.object({
  prints: z.array(HeardEpisodeSchema),
  wanted: z.array(z.string()),
  minSeconds: z.number(),
  enough: z.number(),
  most: z.number(),
});

type SeasonToMatch = z.infer<typeof SeasonToMatchSchema>;

/**
 * Finds what each wanted episode of a season shares with the others: each is held against the
 * fingerprints in the order given, references first, until enough agree or as many as are worth
 * trying have been tried. This is the arithmetic of intro and credit detection, minutes of it on a
 * long season, which is why it runs on a thread of its own rather than on the one answering people.
 *
 * @param season - The season's fingerprints in the order to hold the others against them, the
 *   episodes to find stretches for, how long a stretch must run to count, and how many matches are
 *   enough and how many to try at most.
 * @returns The stretches each wanted episode shares, in its own time, by item.
 */
const matchSeason = ({ prints, wanted, minSeconds, enough, most }: SeasonToMatch) => {
  const byId = new Map(prints.map((print) => [print.mediaId, print]));
  const matched = new Map<string, Range[]>();

  for (const mediaId of wanted) {
    const mine = byId.get(mediaId);

    if (mine === undefined) {
      continue;
    }

    matched.set(
      mediaId,
      heldAgainst(
        mine,
        prints,
        (other) =>
          findSharedAudio(mine.hashes, other.hashes, {
            framesPerSecond: mine.framesPerSecond,
            minSeconds,
          })?.left ?? null,
        { enough, most },
      ),
    );
  }

  return matched;
};

export type { SeasonToMatch };

export { matchSeason, SeasonToMatchSchema };
