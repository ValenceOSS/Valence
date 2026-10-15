import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user } from '#dialect/Schema';
import { createDatabaseChildAccountService } from './createDatabaseChildAccountService';

const STARTING_THE_DATABASE_MS = 60_000;

describe('createDatabaseChildAccountService', () => {
  it(
    'keeps whose child an account is, and the PIN it signs in with',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(user).values([
        { id: 'ada', name: 'Ada', email: 'ada@example.com' },
        { id: 'kit', name: 'Kit', email: 'kit@example.com' },
      ]);

      const children = createDatabaseChildAccountService(db);

      await children.adopt('ada', 'kit');

      expect(await children.list('ada')).toEqual([{ userId: 'kit', hasPin: false }]);

      await children.setPinHash('kit', 'hash');

      expect(await children.pinHashOf('kit')).toBe('hash');
      expect(await children.ownerOf('kit')).toBe('ada');
      expect(await children.ownerOf('ada')).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );
});
