import { describe, expect, it, vi } from 'vitest';
import { createMemoryAuditService } from './createMemoryAuditService';
import { withAuditNews } from './withAuditNews';

describe('withAuditNews', () => {
  it('records the entry and then tells of it once', async () => {
    const tell = vi.fn();
    const audit = withAuditNews(createMemoryAuditService(), tell);

    await audit.record({ actorId: null, actorName: 'Ada', action: 'auth.signedIn' });

    expect(tell).toHaveBeenCalledTimes(1);
    expect((await audit.list({ order: 'newest', limit: 10 })).entries).toHaveLength(1);
  });

  it('tells of nothing when the log is only read or pruned', async () => {
    const tell = vi.fn();
    const audit = withAuditNews(createMemoryAuditService(), tell);

    await audit.list({ order: 'newest', limit: 10 });
    await audit.prune(new Date());

    expect(tell).not.toHaveBeenCalled();
  });
});
