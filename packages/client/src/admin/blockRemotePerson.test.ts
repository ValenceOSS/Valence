import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { blockRemotePerson } from './blockRemotePerson';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('blockRemotePerson', () => {
  it('blocks a person, and lets them back in', async () => {
    const asked = aServerAnswering({
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Sam',
      firstSeenAt: '2026-10-02T12:00:00.000Z',
      lastSeenAt: '2026-10-02T12:00:00.000Z',
      blockedAt: '2026-10-02T13:00:00.000Z',
    });

    expect((await blockRemotePerson('a-server', 'sam', true)).value?.blockedAt).not.toBeNull();
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server/people/sam/block');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT' });

    await blockRemotePerson('a-server', 'sam', false);

    expect(asked.mock.calls[1]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
