import { describe, expect, it } from 'vitest';
import { dropScratchDatabases } from './dropScratchDatabases';

/**
 * A connection that answers the listing with the names given and records every statement.
 *
 * @param names - The databases the server holds under the prefix.
 * @returns The connection, and what it was asked.
 */
const aServer = (names: string[]) => {
  const asked: { statement: string; values?: string[] }[] = [];

  return {
    asked,
    connection: {
      query: (statement: string, values?: string[]): Promise<[object, object?]> => {
        asked.push({ statement, ...(values === undefined ? {} : { values }) });

        return Promise.resolve([
          statement.startsWith('select') ? names.map((name) => ({ name })) : {},
        ]);
      },
    },
  };
};

describe('dropScratchDatabases', () => {
  it('drops each database the run made, and says which', async () => {
    const { asked, connection } = aServer(['valence_test_ab_1', 'valence_test_ab_2']);

    await expect(dropScratchDatabases(connection, 'valence_test_ab_')).resolves.toEqual([
      'valence_test_ab_1',
      'valence_test_ab_2',
    ]);
    expect(asked.slice(1).map((one) => one.statement)).toEqual([
      'drop database `valence_test_ab_1`',
      'drop database `valence_test_ab_2`',
    ]);
  });

  it('matches the prefix literally, so an underscore in it is not a wildcard', async () => {
    const { asked, connection } = aServer([]);

    await dropScratchDatabases(connection, 'valence_test_ab_');

    expect(asked[0]?.values).toEqual(['valence\\_test\\_ab\\_%']);
  });
});
