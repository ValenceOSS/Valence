import { z } from 'zod';

const AFFECTED = z.union([
  z.object({ rowCount: z.number().nullable() }),
  z.object({ affectedRows: z.number() }),
]);

/**
 * Reads how many rows a write touched, from node-postgres's result or PGlite's, which name it
 * differently, so query code can ask "did that change anything" without `returning`.
 *
 * @param result - What the write returned.
 * @returns How many rows it touched.
 */
const countAffected = <T>(result: T): number => {
  const read = AFFECTED.parse(result);

  return 'rowCount' in read ? (read.rowCount ?? 0) : read.affectedRows;
};

export { countAffected };
