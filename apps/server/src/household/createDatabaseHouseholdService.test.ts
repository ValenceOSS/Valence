import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user, userProfile } from '#dialect/Schema';
import { createDatabaseHouseholdService } from './createDatabaseHouseholdService';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A household service over a fresh database holding one account with a household row.
 *
 * @returns The service.
 */
const aService = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db.insert(userProfile).values({ userId: 'ada' });

  return createDatabaseHouseholdService(db, '/nowhere');
};

describe('createDatabaseHouseholdService', () => {
  it(
    'changes a household that is there, and says so',
    async () => {
      const service = await aService();

      await expect(service.change('ada', { name: 'The Lovelaces' })).resolves.toBe(true);
      await expect(service.read('ada', 'Ada')).resolves.toMatchObject({ name: 'The Lovelaces' });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says nothing changed for a household that is not there',
    async () => {
      const service = await aService();

      await expect(service.change('nobody', { name: 'Nobody' })).resolves.toBe(false);
      await expect(service.finishOnboarding('nobody')).resolves.toBe(false);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'marks a household onboarded',
    async () => {
      const service = await aService();

      await expect(service.finishOnboarding('ada')).resolves.toBe(true);
      await expect(service.isOnboarded('ada')).resolves.toBe(true);
    },
    STARTING_POSTGRES_MS,
  );
});
