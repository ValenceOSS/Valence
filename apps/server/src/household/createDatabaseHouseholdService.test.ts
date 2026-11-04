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
    'finds an account by the id it is known by on the way in, and that id by the account',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
      await db
        .insert(userProfile)
        .values({ userId: 'ada', wayInId: '8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a' });

      const service = createDatabaseHouseholdService(db, '/nowhere');

      await expect(service.wayInOf('ada')).resolves.toBe('8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a');
      await expect(service.accountOfWayIn('8d0c2f3e-6f5b-4c0e-9a51-3f1e2d4c5b6a')).resolves.toBe(
        'ada',
      );
      await expect(service.accountOfWayIn('nobody')).resolves.toBeNull();
      await expect(service.wayInOf('nobody')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'changes a household that is there, and says so',
    async () => {
      const service = await aService();

      await expect(service.change('ada', { name: 'The Lovelaces' })).resolves.toBe(true);
      await expect(service.read('ada')).resolves.toMatchObject({ name: 'The Lovelaces' });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'holds nothing of its own until something is chosen, and lets go of what was',
    async () => {
      const service = await aService();

      await expect(service.read('ada')).resolves.toMatchObject({
        name: null,
        colour: null,
        avatar: null,
      });

      await service.change('ada', {
        name: 'The Lovelaces',
        colour: '#3ac47d',
        avatar: { kind: 'drawn', style: 'bottts', seed: 'ada' },
      });

      await expect(service.read('ada')).resolves.toMatchObject({
        name: 'The Lovelaces',
        colour: '#3ac47d',
        avatar: { kind: 'drawn', seed: 'ada' },
      });

      await service.change('ada', { name: null, colour: null, avatar: null });

      await expect(service.read('ada')).resolves.toMatchObject({
        name: null,
        colour: null,
        avatar: null,
      });
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
