import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Takes a piece's number out of the JSON array of numbers in a column, from the one place
 * `uploadPiecesWith` lets it sit.
 *
 * @param column - The column of numbers.
 * @param piece - The number to take out.
 * @returns The new value, for a `set`.
 */
const uploadPiecesWithout = (column: Column, piece: number): SQL =>
  sql`coalesce(json_remove(${column}, concat('$[', (select min(${sql.identifier('held')}.${sql.identifier('place')}) - 1 from json_table(${column}, '$[*]' columns (${sql.identifier('place')} for ordinality, ${sql.identifier('piece')} int path '$')) as ${sql.identifier('held')} where ${sql.identifier('held')}.${sql.identifier('piece')} = ${piece}), ']')), ${column})`;

export { uploadPiecesWithout };
