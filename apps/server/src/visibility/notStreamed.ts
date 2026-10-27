import { eq, not } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { library } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isStreamedItem } from '@ValenceServer/visibility/isStreamedItem';

/**
 * Leaves out the hidden library streamed films are kept in, and the films in it. They are in
 * nobody's library: they are offered wherever somebody's own viewing is — what they are part way
 * through and what they have watched — and nowhere a library's contents are listed.
 *
 * @param db - The database the subquery is built against.
 * @param of - Whether the rows being narrowed are libraries or titles.
 * @returns The condition.
 */
const notStreamed = (db: AnyValenceDatabase, of: 'library' | 'item'): SQL =>
  of === 'library' ? eq(library.isStreamed, false) : not(isStreamedItem(db));

export { notStreamed };
