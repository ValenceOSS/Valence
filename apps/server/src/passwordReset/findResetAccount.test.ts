import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user, viewerProfile } from '#dialect/Schema';
import { findResetAccount } from './findResetAccount';

const STARTING_DATABASE_MS = 60_000;

describe('findResetAccount', () => {
  it(
    'finds an account by its username, its address or a face of its own, and nothing else',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(user).values({
        id: 'u1',
        name: 'Ada',
        email: 'ada@example.com',
        username: 'ada',
        displayUsername: 'Ada',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ada = { userId: 'u1', email: 'ada@example.com' };

      await db.insert(viewerProfile).values({ id: 'p1', userId: 'u1', name: 'Ada', colour: 'blue' });

      expect(await findResetAccount(db, { identifier: 'Ada' })).toEqual(ada);
      expect(await findResetAccount(db, { identifier: ' ADA@example.com ' })).toEqual(ada);
      expect(await findResetAccount(db, { identifier: 'grace' })).toBeNull();
      expect(await findResetAccount(db, { identifier: '  ' })).toBeNull();
      expect(await findResetAccount(db, { profileId: 'p1' })).toEqual(ada);
      expect(await findResetAccount(db, { profileId: 'p2' })).toBeNull();
    },
    STARTING_DATABASE_MS,
  );
});
