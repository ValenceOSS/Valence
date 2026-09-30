import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from './aMigratedDatabase';
import { serverSetting } from '@ValenceServer/db/mysql/Schema';

const MIGRATING_MS = 60_000;

describe('aMigratedDatabase', () => {
  it(
    'holds every table the server runs on, empty',
    async () => {
      const db = await aMigratedDatabase();

      await expect(db.select().from(serverSetting)).resolves.toEqual([]);
    },
    MIGRATING_MS,
  );
});
