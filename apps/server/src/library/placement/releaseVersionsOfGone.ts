import { inVersionOrder } from './inVersionOrder';
import { labelOfVersion } from './labelOfVersion';
import { pathParts } from './pathParts';
import { sharedStart } from './sharedStart';
import type { Placement } from './Placement.types';

/**
 * Takes away the versions whose file they were versions of is gone, so the copy still on disk is
 * the film or the episode itself rather than a version hidden beneath one nobody can play. A show
 * fetched again in another release lands beside the files it replaced, which are still known, and
 * would otherwise be filed under them. The first of what is left, in the order versions are always
 * put in, takes the gone file's place, and the rest become versions of it.
 *
 * @param placed - Where each file was placed.
 * @param isOnDisk - Whether a file is still there.
 * @returns Where each file belongs now, and which files are no longer versions of anything.
 */
const releaseVersionsOfGone = (
  placed: ReadonlyMap<string, Placement>,
  isOnDisk: (path: string) => boolean,
): { placed: Map<string, Placement>; released: string[] } => {
  const orphaned = new Map<string, string[]>();

  for (const [path, placement] of placed) {
    const parent = placement.version?.parentPath;

    if (parent !== undefined && !isOnDisk(parent) && isOnDisk(path)) {
      orphaned.set(parent, [...(orphaned.get(parent) ?? []), path]);
    }
  }

  const result = new Map(placed);
  const released: string[] = [];

  for (const siblings of orphaned.values()) {
    const [primary, ...others] = inVersionOrder(siblings);

    if (primary === undefined) {
      continue;
    }

    const shared = pathParts(primary).stem;
    const taking = result.get(primary);

    if (taking !== undefined) {
      result.set(primary, { ...taking, version: null });
      released.push(primary);
    }

    for (const other of others) {
      const known = result.get(other);

      if (known !== undefined) {
        result.set(other, {
          ...known,
          version: {
            parentPath: primary,
            label: labelOfVersion(other, sharedStart(shared, pathParts(other).stem)),
          },
        });
      }
    }
  }

  return { placed: result, released };
};

export { releaseVersionsOfGone };
