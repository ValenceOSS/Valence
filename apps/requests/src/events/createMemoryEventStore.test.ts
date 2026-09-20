import { describe, expect, it } from 'vitest';
import { createMemoryEventStore } from './createMemoryEventStore';

describe('createMemoryEventStore', () => {
  it('keeps events in order until they are acknowledged', async () => {
    const store = createMemoryEventStore(() => new Date('2026-09-19T00:00:00.000Z'));

    const first = await store.add({ kind: 'started', title: 'Dune', clientName: 'q' });
    const second = await store.add({
      kind: 'failed',
      title: 'Dune',
      clientName: 'q',
      problem: 'x',
    });

    expect(first).toEqual({
      id: 1,
      kind: 'started',
      title: 'Dune',
      clientName: 'q',
      at: '2026-09-19T00:00:00.000Z',
    });

    await store.acknowledge([first.id]);

    expect(await store.pending()).toEqual([second]);
  });

  it('keeps the time by the clock by default', async () => {
    const event = await createMemoryEventStore().add({
      kind: 'started',
      title: 'Dune',
      clientName: 'q',
    });

    expect(Date.parse(event.at)).not.toBeNaN();
  });
});
