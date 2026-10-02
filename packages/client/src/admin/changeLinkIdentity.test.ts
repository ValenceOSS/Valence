import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeLinkIdentity } from './changeLinkIdentity';

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

describe('changeLinkIdentity', () => {
  it('changes this server’s name', async () => {
    const fetchMock = answering({ ...IDENTITY, name: 'Kai’s Valence' });

    expect((await changeLinkIdentity({ name: 'Kai’s Valence' })).value?.name).toBe('Kai’s Valence');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PATCH' });
  });
});
