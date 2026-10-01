import { randomBytes } from 'node:crypto';
import { createConnection } from 'mysql2/promise';
import { dropScratchDatabases } from './dropScratchDatabases';

/**
 * Gives this engine test run a prefix of its own for the scratch databases its tests make, and
 * drops every one of them once the run is over, so a run leaves the server as it found it.
 *
 * @returns What to do when the run is over.
 */
const setup = (): (() => Promise<void>) => {
  const prefix = `valence_test_${randomBytes(4).toString('hex')}_`;

  process.env.VALENCE_SCRATCH_PREFIX = prefix;

  return async () => {
    const url = process.env.MYSQL_TEST_URL;

    if (url === undefined || url === '') {
      return;
    }

    const connection = await createConnection({ uri: url });

    await dropScratchDatabases(connection, prefix);
    await connection.end();
  };
};

export { setup };
