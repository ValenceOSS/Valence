import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Pool } from 'mysql2/promise';
import type { LockSession } from '@ValenceServer/jobs/createDatabaseWorkLock';

const ANSWER = z.tuple([
  z.tuple([z.object({ locked: z.coerce.number().nullable() })]),
  z.array(z.object({})),
]);

/**
 * Names a lock for MySQL, whose lock names stop at 64 characters, by hashing the key.
 *
 * @param key - What is being locked.
 * @returns The lock's name.
 */
const lockName = (key: string): string => `valence:${createHash('sha1').update(key).digest('hex')}`;

/**
 * Checks a connection out of the pool to hold library locks on, as MySQL named locks, which belong
 * to the session that took them and go with it when it dies, as Postgres's advisory locks do.
 *
 * @param pool - The pool to take the connection from.
 * @returns The session.
 */
const openLockSession = async (pool: Pool): Promise<LockSession> => {
  const connection = await pool.getConnection();

  return {
    take: async (key) =>
      ANSWER.parse(await connection.query('select get_lock(?, 0) as locked', [lockName(key)]))[0][0]
        .locked === 1,
    release: async (key) => {
      await connection.query('select release_lock(?) as released', [lockName(key)]);
    },
    on: (event, listener) => {
      connection.on(event, listener);
    },
  };
};

export { openLockSession };
