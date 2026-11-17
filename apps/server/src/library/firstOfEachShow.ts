import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import { qualified } from '@ValenceDatabase/qualified';

/**
 * Narrows a listing to one item for each programme, the episode that comes first in the order the
 * listing is asked in, so a page of twenty is twenty programmes and films rather than twenty files
 * of which a season pack may be most. A film stands for itself, and an episode matched to no series
 * stands with the others of the same series title.
 *
 * @param filters - What the listing already asks of an item.
 * @param ordering - The order the listing is asked in.
 * @returns The condition an item must meet as well to stand in the listing.
 */
const firstOfEachShow = (filters: SQL | undefined, ordering: readonly SQL[]): SQL => {
  const show = sql`coalesce(${qualified(mediaItem.seriesId)}, ${qualified(mediaItem.seriesTitle)}, ${qualified(mediaItem.id)})`;
  const place = sql`row_number() over (partition by ${show} order by ${sql.join([...ordering], sql`, `)})`;
  const asked = filters === undefined ? sql`` : sql` where ${filters}`;

  return sql`${qualified(mediaItem.id)} in (select ${sql.identifier('id')} from (select ${qualified(mediaItem.id)} as ${sql.identifier('id')}, ${place} as ${sql.identifier('place')} from ${mediaItem}${asked}) as ${sql.identifier('firsts')} where ${sql.identifier('place')} = 1)`;
};

export { firstOfEachShow };
