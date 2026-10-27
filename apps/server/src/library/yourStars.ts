import { sql } from 'drizzle-orm';
import { qualified } from '@ValenceDatabase/qualified';
import { mediaItem, rating } from '#dialect/Schema';

/**
 * What one profile gave an item, as a subquery, or nothing where it gave nothing.
 *
 * @param profileId - Whose rating to read.
 * @returns The rating, as a value the query can compare and order by.
 */
const yourStars = (profileId: string) =>
  sql<
    number | null
  >`(select ${qualified(rating.stars)} from ${rating} where ${qualified(rating.mediaItemId)} = ${qualified(mediaItem.id)} and ${qualified(rating.profileId)} = ${profileId} limit 1)`;

export { yourStars };
