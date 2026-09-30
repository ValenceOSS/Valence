import { fileURLToPath } from 'node:url';
import { afterAll, expect } from 'vitest';
import { z } from 'zod';
import { createScratchDatabase } from '@ValenceDatabase/mysql/createScratchDatabase';
import { applyMigrations } from '@ValenceServer/db/mysql/applyMigrations';
import { createDatabase } from '@ValenceServer/db/mysql/createDatabase';

type Made = {
  name: string;
  drop: () => Promise<void>;
  opened: ReturnType<typeof createDatabase>;
  madeFor: string | undefined;
};

const MIGRATIONS = fileURLToPath(new URL('../../../drizzle/mysql/', import.meta.url));

const TABLES = z.tuple([z.array(z.object({ name: z.string() })), z.array(z.object({}))]);

const made: Made[] = [];

/**
 * Empties every table of a database an earlier test finished with, so it can be handed on as new.
 *
 * @param spare - The database.
 */
const emptied = async ({ name, opened }: Made): Promise<void> => {
  const connection = await opened.pool.getConnection();

  try {
    const [tables] = TABLES.parse(
      await connection.query(
        "select table_name as name from information_schema.tables where table_schema = ? and table_name <> '__drizzle_migrations'",
        [name],
      ),
    );

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tables) {
      await connection.query(`DELETE FROM \`${table.name}\``);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    connection.release();
  }
};

afterAll(async () => {
  for (const { opened, drop } of made.splice(0)) {
    await opened.pool.end();
    await drop();
  }
});

/**
 * A database of its own on the MySQL or MariaDB that `MYSQL_TEST_URL` names, brought up to date by
 * every migration the server ships, so a store can be tried against the tables it really runs on.
 *
 * The engine holds every database in memory, so one a finished test was given is emptied and handed
 * to the next rather than another being made, and all of them are dropped once the file is done.
 *
 * @returns The database.
 * @throws If `MYSQL_TEST_URL` is not set.
 */
const aMigratedDatabase = async () => {
  const asking = expect.getState().currentTestName;
  const spare =
    asking === undefined
      ? undefined
      : made.find((one) => one.madeFor !== undefined && one.madeFor !== asking);

  if (spare !== undefined) {
    await emptied(spare);
    spare.madeFor = asking;

    return spare.opened.db;
  }

  const { name, url, drop } = await createScratchDatabase();
  const opened = createDatabase(url);

  made.push({ name, drop, opened, madeFor: asking });

  await applyMigrations(opened.db, MIGRATIONS);

  return opened.db;
};

export { aMigratedDatabase };
