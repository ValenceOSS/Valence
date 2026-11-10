import { desc, sql } from 'drizzle-orm';
import { annasBook } from '@ValenceRequests/db/postgres/Schema';
import type { SQL } from 'drizzle-orm';

/**
 * Which of Anna's Archive's books a search finds, through Postgres' full-text index on their words,
 * and the closest first.
 *
 * @param words - The words searched for.
 * @returns What a book must match, and the order to give them in.
 */
const annasBookMatches = (words: readonly string[]): { where: SQL; order: SQL } => {
  const asked = sql`plainto_tsquery('simple', ${words.join(' ')})`;
  const vector = sql`to_tsvector('simple', ${annasBook.searchKey})`;

  return { where: sql`${vector} @@ ${asked}`, order: desc(sql`ts_rank(${vector}, ${asked})`) };
};

export { annasBookMatches };
