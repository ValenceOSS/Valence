import { z } from 'zod';

const AFFECTED = z.tuple([z.object({ affectedRows: z.number() }), z.undefined()]);

/**
 * Reads how many rows a write touched from mysql2's result header, which counts a row matched but
 * left as it was because the pool asks for `FOUND_ROWS`, as Postgres does.
 *
 * @param result - What the write returned.
 * @returns How many rows it touched.
 */
const countAffected = <T>(result: T): number => AFFECTED.parse(result)[0].affectedRows;

export { countAffected };
