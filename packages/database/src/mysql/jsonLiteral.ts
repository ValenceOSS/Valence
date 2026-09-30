import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * Writes a value as JSON the database reads as JSON rather than as text, through `json_extract`
 * since MariaDB has no `cast(… as json)`.
 *
 * @param value - The value.
 * @returns It, as JSON.
 */
const jsonLiteral = <T>(value: T): SQL => sql`json_extract(${JSON.stringify(value)}, '$')`;

export { jsonLiteral };
