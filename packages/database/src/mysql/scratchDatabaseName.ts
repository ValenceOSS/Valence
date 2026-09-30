import { randomBytes } from 'node:crypto';

/**
 * Names a scratch database for a test, under the prefix the engine test run gave itself so that the
 * run can drop what it made, or under a plain one where a test is run on its own.
 *
 * @returns The name.
 */
const scratchDatabaseName = (): string =>
  `${process.env.VALENCE_SCRATCH_PREFIX ?? 'valence_test_'}${randomBytes(6).toString('hex')}`;

export { scratchDatabaseName };
