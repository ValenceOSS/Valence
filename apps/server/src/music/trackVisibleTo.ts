import { and, eq } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { library } from '#dialect/Schema';
import { librariesVisibleToViewer } from '@ValenceServer/visibility/librariesVisibleToViewer';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * A condition that holds for every song a viewer may hear, read from a query that joins the media
 * item to its library.
 *
 * @param db - The database the subqueries are built against.
 * @param viewer - Who is asking.
 * @returns The condition.
 */
const trackVisibleTo = (db: AnyValenceDatabase, viewer: Viewer): SQL | undefined =>
  and(visibleToViewer(db, viewer), librariesVisibleToViewer(db, viewer), eq(library.kind, 'music'));

export { trackVisibleTo };
