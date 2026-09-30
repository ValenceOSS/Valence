import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * Writes a value as JSON the database compares as JSON rather than as text.
 *
 * @param value - The value.
 * @returns It, as JSON.
 */
const jsonLiteral = <T>(value: T): SQL => sql`${JSON.stringify(value)}::jsonb`;

export { jsonLiteral };
