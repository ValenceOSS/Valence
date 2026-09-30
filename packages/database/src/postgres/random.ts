import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * A number between 0 and 1, different on every row, for ordering at random.
 *
 * @returns The expression.
 */
const random = (): SQL<number> => sql<number>`random()`.mapWith(Number);

export { random };
