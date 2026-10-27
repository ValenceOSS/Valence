import { or, sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';
import { jsonContains } from '@ValenceDatabase/jsonContains';

/**
 * A condition that holds where a list of genres has one of those asked for, or, turned round, where
 * it has none of them — something with no genres at all among them.
 *
 * @param genres - The JSON column of genres.
 * @param anyOf - The genres asked for.
 * @param isNegated - Whether to ask for none of them instead.
 * @returns The condition.
 */
const hasAnyGenre = (genres: Column, anyOf: readonly string[], isNegated: boolean): SQL => {
  const matched = or(...anyOf.map((genre) => jsonContains(genres, [genre]))) ?? sql`false`;

  return isNegated ? sql`not coalesce(${matched}, false)` : sql`coalesce(${matched}, false)`;
};

export { hasAnyGenre };
