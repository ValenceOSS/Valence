import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const PREPARING = new Map<string, Promise<Blob>>();

/**
 * Prepares a database once, keeps a copy of it in a file named for what went into it, and reads it
 * back from there next time.
 *
 * @param name - What the copy is, for its file name.
 * @param recipe - Everything that decides what the database holds, such as its migrations' SQL.
 * @param prepare - How to bring an empty database to that state.
 * @returns The copy, as PGlite dumps it.
 */
const aPreparedCopy = async (
  name: string,
  recipe: string,
  prepare: (client: PGlite) => Promise<void>,
): Promise<Blob> => {
  const kept = join(
    tmpdir(),
    `valence-${name}-${createHash('sha256').update(recipe).digest('hex').slice(0, 16)}.tar`,
  );
  const held = await readFile(kept).catch(() => null);

  if (held !== null) {
    return new Blob([held]);
  }

  const client = new PGlite();

  await prepare(client);

  const copy = await client.dumpDataDir('none');
  const writing = `${kept}.${process.pid.toString()}`;

  await client.close();
  await writeFile(writing, new Uint8Array(await copy.arrayBuffer()));
  await rename(writing, kept);

  return copy;
};

/**
 * A Postgres of its own, in memory, started from a copy of one already prepared — so a test that
 * wants migrated tables gets them without running every migration again, in this file, in another,
 * or in another worker. The copy is kept in a file named for its recipe, so changing a migration
 * makes a new one.
 *
 * @param name - What the copy is, for its file name.
 * @param recipe - Everything that decides what the database holds, such as its migrations' SQL.
 * @param prepare - How to bring an empty database to that state, run only when there is no copy.
 * @returns The database.
 */
const aPreparedPGlite = async (
  name: string,
  recipe: string,
  prepare: (client: PGlite) => Promise<void>,
): Promise<PGlite> => {
  const key = `${name}\n${recipe}`;
  const preparing = PREPARING.get(key) ?? aPreparedCopy(name, recipe, prepare);

  PREPARING.set(key, preparing);

  return new PGlite({ loadDataDir: await preparing });
};

export { aPreparedPGlite };
