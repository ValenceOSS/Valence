import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { readTruth } from '@ValenceServer/db/readTruth';

/**
 * Reads a condition written by hand as a yes-or-no, the same whichever database answered it.
 *
 * @param condition - The condition.
 * @returns It, read as a boolean.
 */
const truth = (condition: SQL): SQL<boolean> => sql<boolean>`${condition}`.mapWith(readTruth);

export { truth };
