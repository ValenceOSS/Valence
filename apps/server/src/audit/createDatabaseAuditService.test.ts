import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { user } from '#dialect/Schema';
import { AuditQuerySchema } from '@ValenceContracts/schemas/Audit';
import { createDatabaseAuditService } from './createDatabaseAuditService';

const STARTING_THE_DATABASE_MS = 60_000;

const asked = (query: Record<string, string | number>) => AuditQuerySchema.parse(query);

/**
 * An audit log over a fresh database whose clock moves a second each time it is read.
 *
 * @returns The log.
 */
const aLog = async () => {
  const db = await aMigratedDatabase();
  let tick = 0;

  await db.insert(user).values([
    { id: 'amara', name: 'Amara', email: 'amara@example.com' },
    { id: 'tom', name: 'Tom', email: 'tom@example.com' },
  ]);

  return createDatabaseAuditService(db, () => new Date(Date.UTC(2026, 9, 22, 3, 0, tick++)));
};

describe('createDatabaseAuditService', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('reads newest or oldest first, a page at a time', async () => {
    const audit = await aLog();

    for (const target of ['Films', 'Shows', 'Music']) {
      await audit.record({ actorId: 'amara', actorName: 'Amara', action: 'library.added', target });
    }

    const newest = await audit.list(asked({ limit: 2 }));
    const older = await audit.list(asked({ limit: 2, cursor: newest.nextCursor ?? '' }));
    const oldest = await audit.list(asked({ limit: 2, order: 'oldest' }));
    const newer = await audit.list(
      asked({ limit: 2, order: 'oldest', cursor: oldest.nextCursor ?? '' }),
    );

    expect(newest.entries.map((entry) => entry.target)).toEqual(['Music', 'Shows']);
    expect(older.entries.map((entry) => entry.target)).toEqual(['Films']);
    expect(oldest.entries.map((entry) => entry.target)).toEqual(['Films', 'Shows']);
    expect(newer.entries.map((entry) => entry.target)).toEqual(['Music']);
  });

  it('narrows by kind of change, person, time and words', async () => {
    const audit = await aLog();

    await audit.record({
      actorId: null,
      actorName: '',
      action: 'auth.signInFailed',
      target: 'tom@example.com',
      address: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });
    await audit.record({ actorId: 'amara', actorName: 'Amara', action: 'auth.signedIn' });
    await audit.record({
      actorId: 'tom',
      actorName: 'Tom',
      action: 'role.created',
      target: 'Kids',
    });

    const targets = async (query: Record<string, string | number>) =>
      (await audit.list(asked({ limit: 10, ...query }))).entries.map((entry) => entry.action);

    expect(await targets({ category: 'auth' })).toEqual(['auth.signedIn', 'auth.signInFailed']);
    expect(await targets({ actorId: 'tom' })).toEqual(['role.created']);
    expect(await targets({ search: '203.0.113' })).toEqual(['auth.signInFailed']);
    expect(await targets({ search: 'KIDS' })).toEqual(['role.created']);
    expect(await targets({ sinceMs: Date.UTC(2026, 9, 22, 3, 0, 1) })).toEqual([
      'role.created',
      'auth.signedIn',
    ]);
    expect((await audit.list(asked({ limit: 10, category: 'auth' }))).entries[1]).toMatchObject({
      address: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('folds a setting changed again straight after into one entry naming both', async () => {
    const audit = await aLog();
    const change = (settings: string) =>
      audit.record(
        { actorId: 'amara', actorName: 'Amara', action: 'settings.changed', detail: { settings } },
        { foldWithinMs: 60_000 },
      );

    await change('roundness');
    await change('roundness');
    await change('hardwareAccel');

    const { entries } = await audit.list(asked({ limit: 10 }));

    expect(entries).toHaveLength(1);
    expect(entries[0]?.detail).toEqual({ settings: 'roundness, hardwareAccel' });
  });

  it('counts failed sign-ins from one address as one entry, but not from another', async () => {
    const audit = await aLog();
    const fail = (address: string) =>
      audit.record(
        {
          actorId: null,
          actorName: '',
          action: 'auth.signInFailed',
          target: 'tom@example.com',
          detail: { method: 'password', attempts: '1' },
          address,
        },
        { foldWithinMs: 60_000 },
      );

    await fail('203.0.113.7');
    await fail('203.0.113.7');
    await fail('203.0.113.7');
    await fail('198.51.100.4');

    const { entries } = await audit.list(asked({ limit: 10 }));

    expect(entries.map((entry) => [entry.address, entry.detail?.['attempts']])).toEqual([
      ['198.51.100.4', '1'],
      ['203.0.113.7', '3'],
    ]);
  });

  it('forgets sign-ins after 90 days and other changes after a year', async () => {
    let at = 0;
    const audit = createDatabaseAuditService(await aMigratedDatabase(), () => new Date(at));
    const record = async (when: number, action: 'auth.signedIn' | 'library.scanned') => {
      at = Math.max(when, at + 1000);
      await audit.record({ actorId: null, actorName: 'Amara', action, target: action });
    };

    await record(Date.UTC(2025, 0, 1), 'auth.signedIn');
    await record(Date.UTC(2025, 0, 1), 'library.scanned');
    await record(Date.UTC(2025, 8, 1), 'auth.signedIn');
    await record(Date.UTC(2025, 8, 1), 'library.scanned');
    await record(Date.UTC(2025, 11, 1), 'auth.signedIn');
    await record(Date.UTC(2025, 11, 1), 'library.scanned');

    expect(await audit.prune(new Date(Date.UTC(2026, 0, 15)))).toBe(3);
    expect(
      (await audit.list(asked({ limit: 10 }))).entries.map((entry) => [
        entry.at.slice(0, 10),
        entry.action,
      ]),
    ).toEqual([
      ['2025-12-01', 'library.scanned'],
      ['2025-12-01', 'auth.signedIn'],
      ['2025-09-01', 'library.scanned'],
    ]);
  });
});
