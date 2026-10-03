import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { makeLinkInvite } from './makeLinkInvite';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('makeLinkInvite', () => {
  it('makes an invite', async () => {
    const asked = aServerAnswering({
      id: '00000000-0000-4000-8000-000000000002',
      createdAt: '2026-10-02T12:00:00.000Z',
      expiresAt: '2026-10-03T12:00:00.000Z',
      invite: 'valence-link:abc',
    });

    expect((await makeLinkInvite()).value?.invite).toBe('valence-link:abc');
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/invites');
  });
});
