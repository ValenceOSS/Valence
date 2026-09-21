import type { Indexer, Release } from '@ValenceContracts/schemas/Indexer';
import type { SeedingRule } from '@ValenceRequests/downloads/hasSeededEnough';

type Keeping = SeedingRule & { removesWhenDone: boolean };

/**
 * Whether a torrent from an indexer is Valence's to clear up once it is filed.
 *
 * Public by default, private not. A public tracker asks nothing of anybody and its torrents are
 * dead weight once the file is in the library; a private one keeps an account open on the strength
 * of what its members give back, and deleting a torrent early there is how an account is lost. An
 * indexer nobody has said anything about is treated as private, because guessing wrong in that
 * direction costs disk and guessing wrong in the other costs the account.
 *
 * @param indexer - The indexer, or nothing where it is no longer set up.
 * @returns Whether to clear its torrents up.
 */
const removesByDefault = (indexer: Pick<Indexer, 'privacy'> | null): boolean =>
  indexer?.privacy === 'public';

/**
 * The larger of two requirements, either of which may be unset.
 *
 * @param asked - What the operator asked for.
 * @param demanded - What the tracker demands.
 * @returns The one that satisfies both.
 */
const theGreater = (asked: number | null, demanded: number | null): number | null => {
  if (asked === null) {
    return demanded;
  }

  return demanded === null ? asked : Math.max(asked, demanded);
};

/**
 * What a torrent has to give back before Valence may clear it up, and whether it clears it up at
 * all.
 *
 * The operator's setting and the tracker's own demand are combined by taking whichever is larger,
 * never whichever is nearer. An operator who asks for an hour on a tracker that demands a week gets
 * the week: the setting is there to seed more than a tracker asks, not to seed less, and a rule
 * that could undercut a tracker would be a rule that loses accounts.
 *
 * A release that says nothing leaves the operator's setting standing, and an operator who has set
 * nothing leaves the tracker's demand standing.
 *
 * @param indexer - The indexer the release came from, or nothing where it is no longer set up.
 * @param release - The release, as the indexer described it.
 * @returns Whether to clear it up, and what it owes first.
 */
const seedingRuleFor = (
  indexer: Pick<Indexer, 'privacy' | 'removesWhenDone' | 'seedSeconds' | 'seedRatio'> | null,
  release: Pick<Release, 'minimumSeedSeconds' | 'minimumRatio'> | null,
): Keeping => ({
  removesWhenDone: indexer?.removesWhenDone ?? removesByDefault(indexer),
  seedSeconds: theGreater(indexer?.seedSeconds ?? null, release?.minimumSeedSeconds ?? null),
  seedRatio: theGreater(indexer?.seedRatio ?? null, release?.minimumRatio ?? null),
});

export type { Keeping };

export { removesByDefault, seedingRuleFor };
