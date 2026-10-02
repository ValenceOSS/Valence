import { describe, expect, it, vi } from 'vitest';
import { createPeerClient } from './createPeerClient';

const IDENTITY = {
  name: 'Anime',
  colour: '#3a8ee8',
  protocols: ['valence-link/1'],
  publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' } as const,
  fingerprint: 'abcd',
};

/**
 * A fetch that answers one thing, and records what it was asked.
 *
 * @param status - The status to answer with.
 * @param body - The body to answer with.
 * @returns The fetch.
 */
const answering = (status: number, body: object) =>
  vi.fn<typeof fetch>(() => Promise.resolve(Response.json(body, { status })));

describe('createPeerClient', () => {
  it('asks a server who it is at its federation address', async () => {
    const fetcher = answering(200, IDENTITY);

    expect(await createPeerClient(fetcher).identityAt('https://anime.example')).toEqual(IDENTITY);
    expect(fetcher).toHaveBeenCalledWith(
      'https://anime.example/api/federation/v1/server',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('believes nothing that is not what it should be', async () => {
    expect(
      await createPeerClient(answering(200, { name: 'nope' })).identityAt('https://a.example'),
    ).toBeNull();
  });

  it('passes on the code of a refusal', async () => {
    const answered = await createPeerClient(
      answering(400, { error: 'Used', code: 'error.linking.thatInviteHasBeenUsed', values: {} }),
    ).pair('https://anime.example', {
      code: 'x'.repeat(20),
      server: {
        name: 'Films',
        colour: '#3a8ee8',
        address: 'https://films.example',
        publicKey: IDENTITY.publicKey,
      },
    });

    expect(answered).toEqual({ kind: 'refused', code: 'error.linking.thatInviteHasBeenUsed' });
  });

  it('says a server is unreachable rather than failing', async () => {
    const fetcher = vi.fn<typeof fetch>(() => Promise.reject(new Error('ECONNREFUSED')));

    expect(await createPeerClient(fetcher).identityAt('https://anime.example')).toBeNull();
    expect(await createPeerClient(fetcher).tellUnlinked('https://anime.example', 't')).toBe(false);
  });

  it('signs the questions that need it', async () => {
    const fetcher = answering(200, {
      pairingId: '00000000-0000-4000-8000-000000000001',
      state: 'linked',
    });

    await createPeerClient(fetcher).pairingState(
      'https://anime.example',
      '00000000-0000-4000-8000-000000000001',
      'a-token',
    );

    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://anime.example/api/federation/v1/pair/00000000-0000-4000-8000-000000000001',
    );
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer a-token' });
  });
});
