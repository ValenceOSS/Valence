import { createLinkService } from '@ValenceServer/linking/createLinkService';
import { createMemoryLinkStore } from '@ValenceServer/linking/createMemoryLinkStore';
import { someLinkSettings } from '@ValenceServer/testing/someLinkSettings';
import type { LinkService } from '@ValenceServer/linking/LinkService';
import type { LinkStore } from '@ValenceServer/linking/LinkStore';
import type { PeerClient } from '@ValenceServer/linking/createPeerClient';

/**
 * A peer client that reaches whichever service answers at an address, without a network.
 *
 * @param at - The services, by their address.
 * @returns The client.
 */
const reaching = (at: Map<string, LinkService>): PeerClient => ({
  identityAt: async (address) => (await at.get(address)?.publicIdentity()) ?? null,
  pair: async (address, request) => {
    const server = at.get(address);

    if (server === undefined) {
      return { kind: 'unreachable' };
    }

    const paired = await server.pair(request);

    return paired.kind === 'paired'
      ? { kind: 'answered', answer: paired.answer }
      : { kind: 'refused', code: `error.linking.${paired.why}` };
  },
  pairingState: async (address, pairingId, token) => {
    const server = at.get(address);

    if (server === undefined) {
      return { kind: 'unreachable' };
    }

    const answer = await server.pairingState(pairingId, token);

    return answer === null
      ? { kind: 'refused', code: 'error.linking.notSignedByALinkedServer' }
      : { kind: 'answered', answer };
  },
  tellUnlinked: async (address, token) => (await at.get(address)?.hearUnlinked(token)) ?? false,
  tellChanged: () => Promise.resolve(true),
  libraries: () => Promise.resolve({ kind: 'unreachable' }),
  activity: () => Promise.resolve({ kind: 'unreachable' }),
  catalogue: () => Promise.resolve({ kind: 'unreachable' }),
  passThrough: () => Promise.resolve(null),
});

/**
 * Two link services that reach each other without a network — Anime and Films — with a way to add
 * more at any address, replacing whatever answered there, and a way to link the first two.
 *
 * @returns Both, their stores, the services by address, how to add one, and how to link them.
 */
const twoLinkingServers = () => {
  const at = new Map<string, LinkService>();
  const peers = reaching(at);

  const add = (
    address: string,
    defaultName: string,
    store: LinkStore = createMemoryLinkStore(),
  ) => {
    const service = createLinkService({
      store,
      settings: someLinkSettings(),
      address,
      defaultName,
      peers,
    });

    at.set(address, service);

    return service;
  };

  const animeStore = createMemoryLinkStore();
  const filmsStore = createMemoryLinkStore();
  const anime = add('https://anime.example', 'Anime', animeStore);
  const films = add('https://films.example', 'Films', filmsStore);

  const link = async () => {
    const used = await films.useInvite((await anime.makeInvite()).invite);
    const filmsAtAnime = (await anime.linking()).servers[0]?.id ?? '';

    await anime.approve(filmsAtAnime);

    const animeAtFilms = used.kind === 'used' ? used.server.id : '';

    await films.check(animeAtFilms);

    return { filmsAtAnime, animeAtFilms };
  };

  return { anime, films, animeStore, filmsStore, at, add, link };
};

export { twoLinkingServers };
