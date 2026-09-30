import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Divides one number by another and rounds down to a whole number, which is what dividing two
 * whole numbers means in Postgres and not in MySQL, where it keeps the fraction.
 *
 * @param dividend - What is divided.
 * @param divisor - What it is divided by.
 * @returns The whole part.
 */
const floorDivided = (
  dividend: Column | SQL | number,
  divisor: Column | SQL | number,
): SQL<number> => sql<number>`floor(${dividend} / ${divisor})`.mapWith(Number);

export { floorDivided };
