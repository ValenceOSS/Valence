import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user } from '#dialect/Schema';
import { createDatabaseSignInStore } from './createDatabaseSignInStore';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseSignInStore', () => {
  it(
    'counts each sign-in and keeps the latest moment',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
      const store = createDatabaseSignInStore(db);

      await expect(store.record('ada', new Date(Date.UTC(2026, 8, 1)))).resolves.toBe(1);
      await expect(store.record('ada', new Date(Date.UTC(2026, 8, 2)))).resolves.toBe(2);
      await expect(store.lastSignInAt('ada')).resolves.toEqual(new Date(Date.UTC(2026, 8, 2)));
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'has no moment for somebody who never signed in',
    async () => {
      const store = createDatabaseSignInStore(await aMigratedDatabase());

      await expect(store.lastSignInAt('nobody')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );
});
