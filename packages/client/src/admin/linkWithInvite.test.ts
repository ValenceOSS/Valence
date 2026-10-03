import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { linkWithInvite } from './linkWithInvite';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('linkWithInvite', () => {
  it('links with the invite as it was pasted', async () => {
    const asked = aServerAnswering(aLinkedServer(), 201);

    expect((await linkWithInvite('valence-link:abc')).value?.state).toBe('awaitingThem');
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ invite: 'valence-link:abc' }),
    });
  });
});
