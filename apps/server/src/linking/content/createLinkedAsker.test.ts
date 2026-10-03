import { describe, expect, it, vi } from 'vitest';
import { twoLinkingServers } from '@ValenceServer/testing/twoLinkingServers';
import { createMemoryLinkSharingStore } from '@ValenceServer/linking/createMemoryLinkSharingStore';
import { createLinkedAsker } from './createLinkedAsker';
import { createPersonScope } from './createPersonScope';
import type { PeerClient } from '@ValenceServer/linking/createPeerClient';

/**
 * Films, linked with Anime, asking it things through a peer client that records each one.
 *
 * @returns The asker, the person scope, what was passed through, Anime's id and its link service.
 */
const asking = async () => {
  const { anime, films, filmsStore, link } = twoLinkingServers();
  const { animeAtFilms } = await link();
  const passThrough = vi.fn<PeerClient['passThrough']>(() => Promise.resolve(new Response('ok')));
  const people = createPersonScope();
  const asker = createLinkedAsker({
    linking: films,
    sharing: createMemoryLinkSharingStore(async (id) => (await filmsStore.readServer(id)) !== null),
    peers: {
      identityAt: () => Promise.resolve(null),
      pair: () => Promise.resolve({ kind: 'unreachable' }),
      pairingState: () => Promise.resolve({ kind: 'unreachable' }),
      tellUnlinked: () => Promise.resolve(false),
      libraries: () => Promise.resolve({ kind: 'unreachable' }),
      activity: () => Promise.resolve({ kind: 'unreachable' }),
      catalogue: () => Promise.resolve({ kind: 'unreachable' }),
      passThrough,
    },
    people,
  });

  return { asker, people, passThrough, animeAtFilms, anime };
};

describe('createLinkedAsker', () => {
  it('passes a request on to the linked server, signed as whoever it is for', async () => {
    const { asker, people, passThrough, animeAtFilms, anime } = await asking();

    await people.runAs(
      () => Promise.resolve({ profileId: 'sam', name: 'Sam' }),
      () => asker.ask(animeAtFilms, '/api/books/one/cover'),
    );

    const [address, token, route, init] = passThrough.mock.calls[0] ?? [];

    expect(address).toBe('https://anime.example');
    expect(route).toBe('/api/books/one/cover');
    expect(init?.method).toBe('GET');
    expect((await anime.readToken(token ?? ''))?.person?.name).toBe('Sam');
  });

  it('asks by a linked address, and for nothing at an address of this server’s own', async () => {
    const { asker, passThrough, animeAtFilms } = await asking();

    await asker.askAt(`linked://${animeAtFilms}/api/books/one/cover`, { method: 'HEAD' });

    expect(passThrough.mock.calls[0]?.[2]).toBe('/api/books/one/cover');
    expect(passThrough.mock.calls[0]?.[3].method).toBe('HEAD');
    expect(await asker.askAt('/b/one.cbz')).toBeNull();
  });

  it('asks nothing of a server it is not linked with', async () => {
    const { asker, passThrough } = await asking();

    expect(
      await asker.ask('00000000-0000-4000-8000-000000000000', '/api/books/one/cover'),
    ).toBeNull();
    expect(passThrough).not.toHaveBeenCalled();
  });
});
