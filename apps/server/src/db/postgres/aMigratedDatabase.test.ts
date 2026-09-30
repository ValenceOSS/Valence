import { describe, expect, it } from 'vitest';
import { serverSetting } from '@ValenceServer/db/postgres/Schema';
import { aMigratedDatabase } from './aMigratedDatabase';

const STARTING_POSTGRES_MS = 60_000;

describe('aMigratedDatabase', () => {
  it(
    'holds every table the server runs on, empty',
    async () => {
      const db = await aMigratedDatabase();

      await expect(db.select().from(serverSetting)).resolves.toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );
});
