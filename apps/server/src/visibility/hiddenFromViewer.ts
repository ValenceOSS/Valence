import { and, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { hiddenByViewer } from '@ValenceServer/visibility/hiddenByViewer';
import { reachableByViewer } from '@ValenceServer/visibility/reachableByViewer';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const NOTHING = sql`false`;

/**
 * What a viewer has hidden and could otherwise be shown, which is what the list on their own profile
 * page is for.
 *
 * The exact inverse of what they are shown, except in the half that is not theirs: something their
 * account may not reach is not listed as hidden either, because it was never theirs to hide and
 * saying so would name it. That asymmetry is the whole point of keeping the two halves apart.
 *
 * Answers with nothing at all — rather than with everything — where the viewer has no profile to
 * have hidden anything with. An absent condition would list the whole library as hidden.
 *
 * @param db - The database the subqueries are built against.
 * @param viewer - Who is asking.
 * @returns The condition, which selects nothing where nobody could have hidden anything.
 */
const hiddenFromViewer = (db: ValenceDatabase, viewer: Viewer): SQL => {
  const hiding = hiddenByViewer(db, viewer);

  if (hiding === undefined) {
    return NOTHING;
  }

  return and(reachableByViewer(db, viewer), hiding) ?? NOTHING;
};

export { hiddenFromViewer };
