import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLinking } from './fetchLinking';

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

const IDENTITY = {
  name: 'Anime',
  colour: '#3a8ee8',
  address: 'https://anime.example',
  protocols: ['valence-link/1'],
  publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
  fingerprint: 'abcd',
};

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

describe('fetchLinking', () => {
  it('reads the identity, the invites and the servers', async () => {
    answering({ identity: IDENTITY, invites: [], servers: [SERVER] });

    expect((await fetchLinking()).servers[0]?.name).toBe('Films');
  });
});
