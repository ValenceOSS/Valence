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
});
