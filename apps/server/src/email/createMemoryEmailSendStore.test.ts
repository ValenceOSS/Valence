import { describe, expect, it } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { createMemoryEmailSendStore } from './createMemoryEmailSendStore';

describe('createMemoryEmailSendStore', () => {
  it('knows a key was sent only once it went, newest first, one per key', async () => {
    const store = createMemoryEmailSendStore(() => new Date('2026-10-02T12:00:00Z'));

    await store.record({
      kind: 'test',
      recipient: 'a@example.com',
      idempotencyKey: 'a',
      failure: sayVerbatim('timed out'),
    });
    await store.record({
      kind: 'test',
      recipient: 'b@example.com',
      idempotencyKey: 'b',
      failure: null,
    });

    expect(await store.wasSent('a')).toBe(false);
    expect(await store.wasSent('b')).toBe(true);

    await store.record({
      kind: 'test',
      recipient: 'a@example.com',
      idempotencyKey: 'a',
      failure: null,
    });

    expect(await store.wasSent('a')).toBe(true);
    expect((await store.recent(10)).map((one) => one.recipient)).toEqual([
      'a@example.com',
      'b@example.com',
    ]);
    expect(await store.recent(1)).toMatchObject([
      { state: 'sent', createdAt: '2026-10-02T12:00:00.000Z' },
    ]);
  });
});
