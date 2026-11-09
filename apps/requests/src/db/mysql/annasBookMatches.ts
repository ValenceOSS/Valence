import { and, asc, like, sql } from 'drizzle-orm';
import { annasBook } from '@ValenceRequests/db/mysql/Schema';
import type { SQL } from 'drizzle-orm';

/**
 * Which of Anna's Archive's books a search finds, by every word in turn, the shortest first since
 * MySQL keeps no full-text index of them here.
 *
 * @param words - The words searched for.
 * @returns What a book must match, and the order to give them in.
 */
const annasBookMatches = (words: readonly string[]): { where: SQL; order: SQL } => ({
  where: and(...words.map((word) => like(annasBook.searchKey, `%${word}%`))) ?? sql`1 = 1`,
  order: asc(sql`char_length(${annasBook.searchKey})`),
});

export { annasBookMatches };
