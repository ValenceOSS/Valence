import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user } from '#dialect/Schema';
import { findResetAccount } from './findResetAccount';

const STARTING_DATABASE_MS = 60_000;

describe('findResetAccount', () => {
  it(
    'finds an account by its username or its address, ignoring case, and nothing else',
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

      expect(await findResetAccount(db, 'Ada')).toEqual(ada);
      expect(await findResetAccount(db, ' ADA@example.com ')).toEqual(ada);
      expect(await findResetAccount(db, 'grace')).toBeNull();
      expect(await findResetAccount(db, '  ')).toBeNull();
    },
    STARTING_DATABASE_MS,
  );
});
