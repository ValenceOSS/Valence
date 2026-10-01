import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user } from '#dialect/Schema';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { createDatabaseProfileService } from './createDatabaseProfileService';

const STARTING_POSTGRES_MS = 60_000;

const COLOUR = PROFILE_COLOURS[0];

/**
 * A profile service over a fresh database holding two accounts.
 *
 * @returns The service.
 */
const aService = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values([
    { id: 'ada', name: 'Ada', email: 'ada@example.com' },
    { id: 'grace', name: 'Grace', email: 'grace@example.com' },
  ]);

  return createDatabaseProfileService(db, '/nowhere');
};

describe('createDatabaseProfileService', () => {
  it(
    'renames a profile of one’s own, and not somebody else’s',
    async () => {
      const service = await aService();
      const made = await service.create('ada', { name: 'Ada', colour: COLOUR });

      await expect(
        service.rename('ada', made.id, { name: 'Countess', colour: COLOUR }),
      ).resolves.toBe(true);
      await expect(
        service.rename('grace', made.id, { name: 'Grace', colour: COLOUR }),
      ).resolves.toBe(false);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'removes a profile once, and never the last one left',
    async () => {
      const service = await aService();
      const first = await service.create('ada', { name: 'Ada', colour: COLOUR });
      const second = await service.create('ada', { name: 'Byron', colour: COLOUR });

      await expect(service.remove('ada', second.id)).resolves.toBe(true);
      await expect(service.remove('ada', second.id)).resolves.toBe(false);
      await expect(service.remove('ada', first.id)).resolves.toBe(false);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'moves a profile that is there to another account',
    async () => {
      const service = await aService();
      const made = await service.create('ada', { name: 'Ada', colour: COLOUR });

      await expect(service.moveTo(made.id, 'grace')).resolves.toBe(true);
      await expect(service.accountOf(made.id)).resolves.toBe('grace');
      await expect(service.moveTo('missing', 'grace')).resolves.toBe(false);
    },
    STARTING_POSTGRES_MS,
  );
});
