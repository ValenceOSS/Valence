import type { IndexerSearchMode } from '@ValenceContracts/schemas/Indexer';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * The profiles worth judging a search against, for what is being searched for.
 *
 * A film judged against a music profile is judged on formats it can never have, so the menu offers
 * only the profiles of the kind being searched for. Searching for anything in particular is the
 * usual case; searching for anything at all cannot narrow, so it offers all of them.
 *
 * Books get none. No profile judges a book anywhere else in Valence, and one that did would be
 * asking an epub for its resolution.
 *
 * @param profiles - Every profile.
 * @param mode - What is being searched for.
 * @returns The profiles to offer, in the order given.
 */
const profilesForMode = (
  profiles: readonly QualityProfile[],
  mode: IndexerSearchMode,
): QualityProfile[] => {
  if (mode === 'book') {
    return [];
  }

  if (mode === 'search') {
    return [...profiles];
  }

  const wanted = mode === 'music' ? 'music' : 'video';

  return profiles.filter((profile) => profile.kind === wanted);
};

export { profilesForMode };
