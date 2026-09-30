import { createConnection } from 'mysql2/promise';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readMysqlAddress } from './connection/readMysqlAddress';
import { createScratchDatabase } from './createScratchDatabase';

const SchemataSchema = z.array(z.object({ collation: z.string() }));

/**
 * Reads the collation a database was made with, or finds there is no such database.
 *
 * @param url - A URL on the test server.
 * @param name - The database.
 * @returns Its collation, once for each database of that name.
 */
const collationsOf = async (url: string, name: string): Promise<string[]> => {
  const { host, port, user, password } = readMysqlAddress(url);
  const connection = await createConnection({ host, port, user, password });

  try {
    const [rows] = await connection.query(
      'select default_collation_name as collation from information_schema.schemata where schema_name = ?',
      [name],
    );

    return SchemataSchema.parse(rows).map((row) => row.collation);
  } finally {
    await connection.end();
  }
};

describe('createScratchDatabase', () => {
  it('makes a database in the binary, no-pad collation the engine names, and drops it again', async () => {
    const scratch = await createScratchDatabase();

    expect(new URL(scratch.url).pathname).toBe(`/${scratch.name}`);
    expect(await collationsOf(scratch.url, scratch.name)).toEqual([
      expect.stringMatching(/^utf8mb4_(0900|nopad)_bin$/),
    ]);

    await scratch.drop();

    expect(await collationsOf(scratch.url, scratch.name)).toEqual([]);
  });
});
