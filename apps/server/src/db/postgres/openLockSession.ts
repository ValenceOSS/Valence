import { z } from 'zod';
import type { LockSession } from '@ValenceServer/jobs/createDatabaseWorkLock';

type LockClient = {
  query: (text: string, values: (string | number)[]) => Promise<{ rows: object[] }>;
  on: (event: 'error', listener: () => void) => void;
};

type LockPool = {
  connect: () => Promise<LockClient>;
};

const VALENCE_LIBRARY_WORK = 0x56414c45;

const TAKE = 'select pg_try_advisory_lock($1, hashtext($2)) as locked';

const RELEASE = 'select pg_advisory_unlock($1, hashtext($2)) as locked';

const ANSWER = z.object({ rows: z.tuple([z.object({ locked: z.boolean() })]) });

/**
 * Checks a connection out of the pool to hold library locks on, as Postgres advisory locks, which
 * belong to the session that took them and go with it when it dies.
 *
 * @param pool - The pool to take the connection from.
 * @returns The session.
 */
const openLockSession = async (pool: LockPool): Promise<LockSession> => {
  const client = await pool.connect();

  return {
    take: async (key) =>
      ANSWER.parse(await client.query(TAKE, [VALENCE_LIBRARY_WORK, key])).rows[0].locked,
    release: async (key) => {
      await client.query(RELEASE, [VALENCE_LIBRARY_WORK, key]);
    },
    on: (event, listener) => {
      client.on(event, listener);
    },
  };
};

export { openLockSession };
