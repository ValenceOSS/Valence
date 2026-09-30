import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Takes a piece's number out of the numbers in a column, wherever it appears. On Postgres the column
 * is an `integer[]`; written here so query code never spells an array.
 *
 * @param column - The column of numbers.
 * @param piece - The number to take out.
 * @returns The new value, for a `set`.
 */
const uploadPiecesWithout = (column: Column, piece: number): SQL =>
  sql`array_remove(${column}, ${piece})`;

export { uploadPiecesWithout };
