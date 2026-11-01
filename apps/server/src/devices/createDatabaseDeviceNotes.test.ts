import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { session, user } from '#dialect/Schema';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { createDatabaseDeviceNotes } from './createDatabaseDeviceNotes';

const STARTING_POSTGRES_MS = 60_000;

const NOW = new Date(Date.UTC(2026, 10, 1, 12));

const LATER = new Date(Date.UTC(2026, 11, 1, 12));

const EARLIER = new Date(Date.UTC(2026, 9, 1, 12));

const AN_IPHONE = identifyDevice({
  userAgent: null,
  kind: 'phone',
  hints: { system: 'ios', model: 'iPhone 17 Pro Max' },
});

/**
 * Device notes over a fresh database holding two accounts: Ada with two sign-ins in force and one
 * run out, and Bea with one.
 *
 * @returns The device notes.
 */
const aStore = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values([
    { id: 'ada', name: 'Ada', email: 'ada@example.com' },
    { id: 'bea', name: 'Bea', email: 'bea@example.com' },
  ]);
  await db.insert(session).values([
    {
      id: 'ada-phone',
      token: 'token-1',
      userId: 'ada',
      expiresAt: LATER,
      updatedAt: EARLIER,
      createdAt: EARLIER,
      userAgent: 'Valence/1 CFNetwork/3826 Darwin/25.0.0',
      ipAddress: '192.168.1.40',
      deviceId: 'phone-device',
    },
    { id: 'ada-mac', token: 'token-2', userId: 'ada', expiresAt: LATER, updatedAt: EARLIER },
    { id: 'ada-gone', token: 'token-3', userId: 'ada', expiresAt: EARLIER, updatedAt: EARLIER },
    { id: 'bea-tv', token: 'token-4', userId: 'bea', expiresAt: LATER, updatedAt: EARLIER },
    {
      id: 'ada-seen-by-bea',
      token: 'token-5',
      userId: 'ada',
      expiresAt: LATER,
      updatedAt: EARLIER,
      impersonatedBy: 'bea',
    },
  ]);

  return createDatabaseDeviceNotes(db);
};

describe('createDatabaseDeviceNotes', () => {
  it(
    'lists the sign-ins an account holds that have not run out',
    async () => {
      const notes = await aStore();

      const held = await notes.heldBy('ada', NOW);

      expect(held.map((one) => one.id).toSorted()).toStrictEqual(['ada-mac', 'ada-phone']);
      expect(held.find((one) => one.id === 'ada-phone')).toStrictEqual({
        id: 'ada-phone',
        deviceId: 'phone-device',
        device: null,
        userAgent: 'Valence/1 CFNetwork/3826 Darwin/25.0.0',
        ipAddress: '192.168.1.40',
        createdAt: EARLIER,
        lastActiveAt: null,
        expiresAt: LATER,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'notes what a device is, which it is and when it was seen',
    async () => {
      const notes = await aStore();

      await notes.note('ada-mac', { deviceId: 'mac-device', identity: AN_IPHONE, at: NOW });

      const held = await notes.heldBy('ada', NOW);

      expect(held.find((one) => one.id === 'ada-mac')).toMatchObject({
        deviceId: 'mac-device',
        device: AN_IPHONE,
        lastActiveAt: NOW,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps which device a sign-in is where a later note does not say',
    async () => {
      const notes = await aStore();

      await notes.note('ada-phone', { deviceId: null, identity: AN_IPHONE, at: NOW });

      const held = await notes.heldBy('ada', NOW);

      expect(held.find((one) => one.id === 'ada-phone')).toMatchObject({
        deviceId: 'phone-device',
        device: AN_IPHONE,
        lastActiveAt: NOW,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'notes when a sign-in was last in use, and nothing else about it',
    async () => {
      const notes = await aStore();

      await notes.noteActive('ada-phone', NOW);

      const held = await notes.heldBy('ada', NOW);

      expect(held.find((one) => one.id === 'ada-phone')).toMatchObject({
        deviceId: 'phone-device',
        device: null,
        lastActiveAt: NOW,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'has no names for an account that never renamed a device',
    async () => {
      const notes = await aStore();

      await expect(notes.renamedBy('ada')).resolves.toStrictEqual(new Map());
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'renames a device, renames it again, and gives it back its own name',
    async () => {
      const notes = await aStore();

      await notes.rename('ada', 'phone-device', 'Kitchen phone');

      await expect(notes.renamedBy('ada')).resolves.toStrictEqual(
        new Map([['phone-device', 'Kitchen phone']]),
      );

      await notes.rename('ada', 'phone-device', 'Bedside phone');

      await expect(notes.renamedBy('ada')).resolves.toStrictEqual(
        new Map([['phone-device', 'Bedside phone']]),
      );

      await notes.rename('ada', 'phone-device', null);

      await expect(notes.renamedBy('ada')).resolves.toStrictEqual(new Map());
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one account’s names for its devices from another’s',
    async () => {
      const notes = await aStore();

      await notes.rename('ada', 'shared-device', 'Ada’s laptop');
      await notes.rename('bea', 'shared-device', 'Bea’s laptop');
      await notes.rename('bea', 'shared-device', null);

      await expect(notes.renamedBy('ada')).resolves.toStrictEqual(
        new Map([['shared-device', 'Ada’s laptop']]),
      );
      await expect(notes.renamedBy('bea')).resolves.toStrictEqual(new Map());
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'signs out only the account’s own sign-ins it is asked to',
    async () => {
      const notes = await aStore();

      await notes.end('ada', ['ada-phone', 'bea-tv']);

      expect((await notes.heldBy('ada', NOW)).map((one) => one.id)).toStrictEqual(['ada-mac']);
      expect((await notes.heldBy('bea', NOW)).map((one) => one.id)).toStrictEqual(['bea-tv']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'signs out nothing when asked to sign out no sign-ins',
    async () => {
      const notes = await aStore();

      await notes.end('ada', []);

      expect(await notes.heldBy('ada', NOW)).toHaveLength(2);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'leaves out a sign-in an administrator made as the account, which is not one of its devices',
    async () => {
      const notes = await aStore();

      expect((await notes.heldBy('ada', NOW)).map((one) => one.id)).not.toContain(
        'ada-seen-by-bea',
      );
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'carries a name given to a sign-in over to its device once its client says which it is',
    async () => {
      const notes = await aStore();

      await notes.rename('ada', 'ada-mac', 'Study Mac');
      await notes.note('ada-mac', { deviceId: 'mac-device', identity: AN_IPHONE, at: NOW });

      expect(await notes.renamedBy('ada')).toStrictEqual(new Map([['mac-device', 'Study Mac']]));
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the device’s own name where both it and the sign-in were renamed',
    async () => {
      const notes = await aStore();

      await notes.rename('ada', 'ada-mac', 'Study Mac');
      await notes.rename('ada', 'mac-device', 'Office Mac');
      await notes.note('ada-mac', { deviceId: 'mac-device', identity: AN_IPHONE, at: NOW });

      expect(await notes.renamedBy('ada')).toStrictEqual(new Map([['mac-device', 'Office Mac']]));
    },
    STARTING_POSTGRES_MS,
  );
});
