import { afterEach, describe, expect, it, vi } from 'vitest';
import { linkWithInvite } from './linkWithInvite';

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

const SERVER = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  colour: '#e8503a',
  address: 'https://films.example',
  fingerprint: 'ef01',
  state: 'awaitingThem',
  createdAt: '2026-10-02T12:00:00.000Z',
  linkedAt: null,
  lastSeenAt: null,
};

describe('linkWithInvite', () => {
  it('links with the invite as it was pasted', async () => {
    const fetchMock = answering(SERVER, 201);

    expect((await linkWithInvite('valence-link:abc')).value?.state).toBe('awaitingThem');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/linked-servers');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ invite: 'valence-link:abc' }),
    });
  });
});
