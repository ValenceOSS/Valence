import { describe, expect, it } from 'vitest';
import { createMemoryAuditService } from './createMemoryAuditService';

describe('createMemoryAuditService', () => {
  it('lists the newest first, a page at a time', async () => {
    let tick = 0;
    const audit = createMemoryAuditService(() => new Date(Date.UTC(2026, 9, 17, 0, 0, tick++)));

    for (const target of ['Films', 'Shows', 'Music']) {
      await audit.record({ actorId: 'a', actorName: 'Amara', action: 'library.added', target });
    }

    const first = await audit.list({ limit: 2 });

    expect(first.entries.map((entry) => entry.target)).toEqual(['Music', 'Shows']);
    expect(first.nextCursor).not.toBeNull();

    const second = await audit.list({ limit: 2, cursor: first.nextCursor ?? '' });

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

    expect((await audit.list({ limit: 10, action: 'role.created' })).entries).toHaveLength(1);
    expect((await audit.list({ limit: 10, actorId: 'b' })).entries[0]?.actorName).toBe('Tom');
  });
});
