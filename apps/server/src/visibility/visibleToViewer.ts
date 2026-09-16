import { and, not } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { hiddenByViewer } from '@ValenceServer/visibility/hiddenByViewer';
import { reachableByViewer } from '@ValenceServer/visibility/reachableByViewer';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * What a viewer should be shown: everything their account may reach, less whatever they have hidden.
 *
 * This is the condition every list of media passes through, and the reason there is one of it. Three
 * separate features want to remove items from every surface that returns content, and a condition
 * repeated in a dozen query builders is a condition missing from the thirteenth.
 *
 * Enforcement and preference are combined here and nowhere else, which is what keeps them from being
 * confused for one another everywhere else. The gate on reaching a single item by its address asks
 * only the enforcement half, so a hidden item still answers when somebody follows a link to it,
 * while a forbidden one does not.
 *
 * @param db - The database the subqueries are built against.
 * @param viewer - Who is asking.
 * @returns The condition, or nothing where this viewer is restricted in no way at all.
 */
const visibleToViewer = (db: ValenceDatabase, viewer: Viewer): SQL | undefined => {
  const hiding = hiddenByViewer(db, viewer);

  return and(reachableByViewer(db, viewer), hiding === undefined ? undefined : not(hiding));
};

export { visibleToViewer };
