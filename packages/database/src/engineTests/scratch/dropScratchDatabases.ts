import { z } from 'zod';

type Connection = {
  query: (statement: string, values?: string[]) => Promise<[object, object?]>;
};

const NamesSchema = z.array(z.object({ name: z.string() }));

/**
 * Drops every database whose name starts with a prefix, which is how one engine test run clears
 * away the scratch databases it made without touching those of a run beside it.
 *
 * @param connection - A connection to the server the databases are on.
 * @param prefix - What each of this run's database names starts with.
 * @returns The names it dropped.
 */
const dropScratchDatabases = async (connection: Connection, prefix: string): Promise<string[]> => {
  const [rows] = await connection.query(
    'select schema_name as name from information_schema.schemata where schema_name like ?',
    [`${prefix.replaceAll('_', '\\_')}%`],
  );
  const names = NamesSchema.parse(rows).map((row) => row.name);

  for (const name of names) {
    await connection.query(`drop database \`${name}\``);
  }

  return names;
};

export { dropScratchDatabases };
