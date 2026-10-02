import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeLinkInvite } from './makeLinkInvite';

const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(
      body === null ? new Response(null, { status }) : Response.json(body, { status }),
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('makeLinkInvite', () => {
  it('makes an invite', async () => {
    const fetchMock = answering({
      id: '00000000-0000-4000-8000-000000000002',
      createdAt: '2026-10-02T12:00:00.000Z',
      expiresAt: '2026-10-03T12:00:00.000Z',
      invite: 'valence-link:abc',
    });

    expect((await makeLinkInvite()).value?.invite).toBe('valence-link:abc');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/linked-servers/invites');
  });
});
