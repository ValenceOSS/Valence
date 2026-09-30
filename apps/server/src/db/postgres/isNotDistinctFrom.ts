import { sql } from 'drizzle-orm';
import type { SQL, SQLWrapper } from 'drizzle-orm';

/**
 * Compares two values the way a person would, where nothing equals nothing — which `=` does not,
 * since in SQL a comparison with NULL is never true.
 *
 * @param left - One value.
 * @param right - The other.
 * @returns Whether they are the same, NULLs included.
 */
const isNotDistinctFrom = (
  left: SQLWrapper | string | number | boolean | Date | null,
  right: SQLWrapper | string | number | boolean | Date | null,
): SQL => sql`${left} is not distinct from ${right}`;

export { isNotDistinctFrom };
