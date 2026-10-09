import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * The order of every profile once one changes places with the next of its kind above or below it,
 * or null where there is none that way.
 *
 * @param profiles - Every profile, highest first.
 * @param id - The one moving.
 * @param by - Up one place, or down one.
 * @returns The ids in their new order, or null.
 */
const moveProfile = (
  profiles: readonly Pick<QualityProfile, 'id' | 'kind'>[],
  id: string,
  by: -1 | 1,
): string[] | null => {
  const at = profiles.findIndex((profile) => profile.id === id);
  const moving = profiles[at];

  if (moving === undefined) {
    return null;
  }

  const ids = profiles.map((profile) => profile.id);
  const kin = profiles.flatMap((profile, place) => (profile.kind === moving.kind ? [place] : []));
  const neighbour = kin[kin.indexOf(at) + by];

  if (neighbour === undefined) {
    return null;
  }

  ids[at] = ids[neighbour] ?? id;
  ids[neighbour] = id;

  return ids;
};

export { moveProfile };
