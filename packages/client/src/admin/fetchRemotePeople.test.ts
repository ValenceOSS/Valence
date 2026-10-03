import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchRemotePeople } from './fetchRemotePeople';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchRemotePeople', () => {
  it('reads the people seen from a linked server', async () => {
    aServerAnswering({
      people: [
        {
          id: '00000000-0000-4000-8000-000000000003',
          name: 'Sam',
          firstSeenAt: '2026-10-02T12:00:00.000Z',
          lastSeenAt: '2026-10-02T12:00:00.000Z',
          blockedAt: null,
        },
      ],
    });

    expect((await fetchRemotePeople('a-server')).map((person) => person.name)).toEqual(['Sam']);
  });
});
