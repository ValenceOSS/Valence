import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Adds a piece's number to the numbers already in a column, once however often it arrives, kept in
 * order. On Postgres the column is an `integer[]`; written here so query code never spells an array.
 *
 * @param column - The column of numbers.
 * @param piece - The number to add.
 * @returns The new value, for a `set`.
 */
const uploadPiecesWith = (column: Column, piece: number): SQL =>
  sql`(select coalesce(array_agg(distinct piece order by piece), '{}') from unnest(array_append(${column}, ${piece})) as piece)`;

export { uploadPiecesWith };
