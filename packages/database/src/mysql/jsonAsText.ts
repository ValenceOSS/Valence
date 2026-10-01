import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Reads a JSON column as its text, for comparing or grouping by what it says.
 *
 * @param column - The JSON column, or an expression that is one.
 * @returns Its text.
 */
const jsonAsText = (column: Column | SQL): SQL<string> => sql<string>`cast(${column} as char)`;

export { jsonAsText };
