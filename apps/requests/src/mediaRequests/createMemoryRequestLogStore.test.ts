import { describe, expect, it } from 'vitest';
import { createMemoryRequestLogStore } from './createMemoryRequestLogStore';

describe('createMemoryRequestLogStore', () => {
  it('keeps what each request did, newest first', async () => {
    const { store, said } = createMemoryRequestLogStore(() => new Date('2026-09-19T00:00:00.000Z'));

    await store.add('dune', 'Searched');
    await store.add('dune', 'Chose one', 'CloudflareCheckFailed');
    await store.add('heat', 'Searched');

    expect(await store.list('dune')).toEqual([
      {
        id: 2,
        at: '2026-09-19T00:00:00.000Z',
        message: 'Chose one',
        problemCode: 'CloudflareCheckFailed',
      },
      { id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched', problemCode: null },
    ]);
    expect(said).toHaveLength(3);
  });

  it('keeps the time by the clock by default', async () => {
    const { store } = createMemoryRequestLogStore();

    await store.add('dune', 'Searched');

    expect(Date.parse((await store.list('dune'))[0]?.at ?? '')).not.toBeNaN();
  });
});
