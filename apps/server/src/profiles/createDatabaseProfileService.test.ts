import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user, userProfile } from '#dialect/Schema';
import { eq } from 'drizzle-orm';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { createDatabaseProfileService } from './createDatabaseProfileService';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

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
    'keeps how somebody wants to look on Discord, and starts everybody from the defaults',
    async () => {
      const service = await aService();
      const made = await service.create('ada', { name: 'Ada', colour: COLOUR });

      expect(made.discordPresence).toEqual(DEFAULT_DISCORD_PRESENCE);

      const chosen = {
        ...DEFAULT_DISCORD_PRESENCE,
        statusShows: 'title' as const,
        logo: 'dark' as const,
      };

      await service.rename('ada', made.id, {
        name: 'Ada',
        colour: COLOUR,
        discordPresence: chosen,
      });

      const [kept] = await service.list('ada');

      expect(kept?.discordPresence).toEqual(chosen);
    },
    STARTING_POSTGRES_MS,
  );

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

  it(
    'makes the account’s first profile its owner, and nobody added after',
    async () => {
      const service = await aService();
      const first = await service.ensureDefault('ada', 'Ada');
      const second = await service.create('ada', { name: 'Byron', colour: COLOUR });

      expect(first.isOwner).toBe(true);
      expect(second.isOwner).toBe(false);
      await expect(service.list('ada')).resolves.toMatchObject([
        { id: first.id, isOwner: true, hasPin: false, mayRequest: true },
        { id: second.id, isOwner: false, hasPin: false, mayRequest: true },
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'makes one owner where the first requests of a new account all ask for one at once',
    async () => {
      const service = await aService();

      const made = await Promise.all(
        Array.from({ length: 6 }, () => service.ensureDefault('ada', 'Ada')),
      );
      const everyone = await service.list('ada');

      expect(everyone).toHaveLength(1);
      expect(everyone[0]?.isOwner).toBe(true);
      expect(new Set(made.map((profile) => profile.id))).toEqual(new Set([everyone[0]?.id]));
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'never removes the owner, even with others on the account',
    async () => {
      const service = await aService();
      const owner = await service.ensureDefault('ada', 'Ada');

      await service.create('ada', { name: 'Byron', colour: COLOUR });

      await expect(service.remove('ada', owner.id)).resolves.toBe(false);
      await expect(service.list('ada')).resolves.toHaveLength(2);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says where a profile stands, and nothing for one that is not there',
    async () => {
      const service = await aService();

      await service.ensureDefault('ada', 'Ada');

      const made = await service.create('ada', { name: 'Byron', colour: COLOUR });

      await expect(service.standingOf(made.id)).resolves.toEqual({
        id: made.id,
        userId: 'ada',
        name: 'Byron',
        isOwner: false,
        mayRequest: true,
        pinHash: null,
        pinFailures: 0,
        pinLockedUntil: null,
      });
      await expect(service.standingOf('missing')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'counts tries at a PIN made at once one by one, and refuses them once it is locked',
    async () => {
      const service = await aService();
      const made = await service.ensureDefault('ada', 'Ada');
      const at = new Date('2026-10-15T12:00:00.000Z');
      const until = new Date('2026-10-15T12:01:00.000Z');

      const tries = await Promise.all(
        Array.from({ length: 8 }, () =>
          service.claimAPinTry(made.id, at, (failures) => (failures === 5 ? until : null)),
        ),
      );

      expect(tries.filter((one) => one?.kind === 'counted')).toHaveLength(5);
      expect(tries.filter((one) => one?.kind === 'locked')).toHaveLength(3);
      await expect(service.standingOf(made.id)).resolves.toMatchObject({
        pinFailures: 5,
        pinLockedUntil: until,
      });
      await expect(service.claimAPinTry('nobody', at, () => null)).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps a PIN, starts the count of wrong tries again with it, and takes it away',
    async () => {
      const service = await aService();
      const made = await service.ensureDefault('ada', 'Ada');
      const until = new Date('2026-10-15T12:01:00.000Z');

      await service.setPinTries(made.id, 5, until);

      await expect(service.standingOf(made.id)).resolves.toMatchObject({
        pinFailures: 5,
        pinLockedUntil: until,
      });

      await service.setPin(made.id, 'scrypt$salt$hash');

      await expect(service.standingOf(made.id)).resolves.toMatchObject({
        pinHash: 'scrypt$salt$hash',
        pinFailures: 0,
        pinLockedUntil: null,
      });
      await expect(service.list('ada')).resolves.toMatchObject([{ hasPin: true }]);

      await service.setPin(made.id, null);

      await expect(service.list('ada')).resolves.toMatchObject([{ hasPin: false }]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'stops a profile asking for things, and lets it again',
    async () => {
      const service = await aService();

      await service.ensureDefault('ada', 'Ada');

      const made = await service.create('ada', { name: 'Byron', colour: COLOUR });

      await service.setMayRequest(made.id, false);

      await expect(service.standingOf(made.id)).resolves.toMatchObject({ mayRequest: false });

      await service.setMayRequest(made.id, true);

      await expect(service.standingOf(made.id)).resolves.toMatchObject({ mayRequest: true });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'hands the account to another of its profiles, and never to one on another account',
    async () => {
      const service = await aService();
      const owner = await service.ensureDefault('ada', 'Ada');
      const made = await service.create('ada', { name: 'Byron', colour: COLOUR });
      const theirs = await service.ensureDefault('grace', 'Grace');

      await expect(service.handOver('ada', theirs.id)).resolves.toBe(false);
      await expect(service.handOver('ada', made.id)).resolves.toBe(true);
      await expect(service.list('ada')).resolves.toMatchObject([
        { id: made.id, isOwner: true },
        { id: owner.id, isOwner: false },
      ]);
      await expect(service.standingOf(theirs.id)).resolves.toMatchObject({ isOwner: true });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'makes a profile moved to another account its owner there',
    async () => {
      const service = await aService();

      await service.ensureDefault('ada', 'Ada');

      const made = await service.create('ada', { name: 'Byron', colour: COLOUR });

      await service.moveTo(made.id, 'grace');

      await expect(service.standingOf(made.id)).resolves.toMatchObject({
        userId: 'grace',
        isOwner: true,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'draws each profile with its own face, and leaves the household’s alone when one changes',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(user).values([{ id: 'ada', name: 'Ada', email: 'ada@example.com' }]);
      await db
        .insert(userProfile)
        .values({ userId: 'ada', avatarStyle: 'adventurer', avatarSeed: 'household' });

      const service = createDatabaseProfileService(db, '/nowhere');
      const made = await service.create('ada', { name: 'Kid', colour: COLOUR });
      const [listed] = await service.list('ada');

      expect(listed?.avatar).toEqual({ kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED });
      await expect(service.readAvatar(made.id)).resolves.toBeNull();

      await service.rename('ada', made.id, {
        name: 'Kid',
        colour: COLOUR,
        avatar: { kind: 'drawn', style: 'adventurer', seed: 'kid' },
      });

      const [household] = await db.select().from(userProfile).where(eq(userProfile.userId, 'ada'));

      expect(household?.avatarSeed).toBe('household');
    },
    STARTING_POSTGRES_MS,
  );
});
