import { describe, expect, it } from 'vitest';
import { AuditQuerySchema } from '@ValenceContracts/schemas/Audit';
import { createMemoryAuditService } from './createMemoryAuditService';

const asked = (query: Record<string, string | number>) => AuditQuerySchema.parse(query);

describe('createMemoryAuditService', () => {
  it('lists the newest first, a page at a time', async () => {
    let tick = 0;
    const audit = createMemoryAuditService(() => new Date(Date.UTC(2026, 9, 17, 0, 0, tick++)));

    for (const target of ['Films', 'Shows', 'Music']) {
      await audit.record({ actorId: 'a', actorName: 'Amara', action: 'library.added', target });
    }

    const first = await audit.list(asked({ limit: 2 }));

    expect(first.entries.map((entry) => entry.target)).toEqual(['Music', 'Shows']);
    expect(first.nextCursor).not.toBeNull();

    const second = await audit.list(asked({ limit: 2, cursor: first.nextCursor ?? '' }));

    expect(second.entries.map((entry) => entry.target)).toEqual(['Films']);
    expect(second.nextCursor).toBeNull();
  });

  it('narrows to one kind of change, or one person', async () => {
    const audit = createMemoryAuditService();

    await audit.record({
      actorId: 'a',
      actorName: 'Amara',
      action: 'role.created',
      target: 'Kids',
    });
    await audit.record({ actorId: 'b', actorName: 'Tom', action: 'share.withdrawn', target: 'Up' });

    expect((await audit.list(asked({ limit: 10, action: 'role.created' }))).entries).toHaveLength(
      1,
    );
    expect((await audit.list(asked({ limit: 10, actorId: 'b' }))).entries[0]?.actorName).toBe(
      'Tom',
    );
  });

  it('reads oldest first when asked, a page at a time', async () => {
    let tick = 0;
    const audit = createMemoryAuditService(() => new Date(Date.UTC(2026, 9, 17, 0, 0, tick++)));

    for (const target of ['Films', 'Shows', 'Music']) {
      await audit.record({ actorId: 'a', actorName: 'Amara', action: 'library.added', target });
    }

    const first = await audit.list(asked({ limit: 2, order: 'oldest' }));
    const second = await audit.list(
      asked({ limit: 2, order: 'oldest', cursor: first.nextCursor ?? '' }),
    );

    expect(first.entries.map((entry) => entry.target)).toEqual(['Films', 'Shows']);
    expect(second.entries.map((entry) => entry.target)).toEqual(['Music']);
  });

  it('folds a change made again straight after into the entry it repeats', async () => {
    let tick = 0;
    const audit = createMemoryAuditService(() => new Date(Date.UTC(2026, 9, 17, 0, 0, tick++)));
    const change = (settings: string) =>
      audit.record(
        { actorId: 'a', actorName: 'Amara', action: 'settings.changed', detail: { settings } },
        { foldWithinMs: 60_000 },
      );

    await change('roundness');
    await change('roundness');
    await change('hardwareAccel');

    const { entries } = await audit.list(asked({ limit: 10 }));

    expect(entries).toHaveLength(1);
    expect(entries[0]?.detail).toEqual({ settings: 'roundness, hardwareAccel' });
  });

  it('keeps where a change came from', async () => {
    const audit = createMemoryAuditService();

    await audit.record({
      actorId: null,
      actorName: '',
      action: 'auth.signInFailed',
      target: 'tom@example.com',
      address: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });

    expect((await audit.list(asked({ limit: 1 }))).entries[0]).toMatchObject({
      address: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('counts failed sign-ins from one address as one entry, but not from another', async () => {
    let tick = 0;
    const audit = createMemoryAuditService(() => new Date(Date.UTC(2026, 9, 17, 0, 0, tick++)));
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
    const audit = createMemoryAuditService(() => new Date(at));
    const record = async (when: number, action: 'auth.signedIn' | 'library.scanned') => {
      at = Math.max(when, at + 1000);
      await audit.record({ actorId: 'a', actorName: 'Amara', action, target: action });
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
