import { concernKey } from '@ValenceScreens/components/AdminArea/concernKey';
import type { Concern } from '@ValenceScreens/components/AdminArea/collectConcerns';

/**
 * The dismissals still worth keeping: those of concerns that still stand. Once a concern has gone,
 * its dismissal goes with it, so that the same trouble coming back is shown again rather than
 * silenced for good.
 *
 * @param dismissed - The dismissed concerns' keys.
 * @param concerns - The concerns standing now, with everything they are judged on read.
 * @returns The keys to keep.
 */
const standingDismissals = (
  dismissed: readonly string[],
  concerns: readonly Pick<Concern, 'id' | 'title'>[],
): string[] => {
  const standing = new Set(concerns.map(concernKey));

  return dismissed.filter((key) => standing.has(key));
};

export { standingDismissals };
