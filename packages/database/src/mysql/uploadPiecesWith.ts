import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Adds a piece's number to the JSON array of numbers in a column, once however often it arrives, by
 * putting it after the numbers smaller than it.
 *
 * @param column - The column of numbers.
 * @param piece - The number to add.
 * @returns The new value, for a `set`.
 */
const uploadPiecesWith = (column: Column, piece: number): SQL => {
  const held = sql`coalesce(${column}, json_array())`;

  return sql`case when json_contains(${held}, json_array(${piece})) then ${held} else json_array_insert(${held}, concat('$[', (select count(*) from json_table(${held}, '$[*]' columns (${sql.identifier('piece')} int path '$')) as ${sql.identifier('held')} where ${sql.identifier('held')}.${sql.identifier('piece')} < ${piece}), ']'), ${piece}) end`;
};

export { uploadPiecesWith };
