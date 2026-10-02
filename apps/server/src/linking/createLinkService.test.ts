import { describe, expect, it } from 'vitest';
import { createLinkService } from './createLinkService';
import { createMemoryLinkStore } from './createMemoryLinkStore';
import { LINK_SETTINGS_DEFAULTS } from './LinkSettings';
import type { LinkService } from './LinkService';
import type { LinkSettings } from './LinkSettings';
import type { PeerClient } from './createPeerClient';

/**
 * Settings held in memory, as the server's own would be.
 *
 * @returns Where a service keeps its key, name, colour and address.
 */
const someSettings = () => {
  let held: LinkSettings = LINK_SETTINGS_DEFAULTS;

  return {
    read: () => Promise.resolve(held),
    write: (next: LinkSettings) => {
      held = next;

      return Promise.resolve();
    },
  };
};

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
});

/**
 * Two servers that can reach each other: Anime at one address and Films at the other.
 *
 * @returns Both.
 */
const twoServers = () => {
  const at = new Map<string, LinkService>();
  const peers = reaching(at);
  const anime = createLinkService({
    store: createMemoryLinkStore(),
    settings: someSettings(),
    address: 'https://anime.example',
    defaultName: 'Anime',
    peers,
  });
  const films = createLinkService({
    store: createMemoryLinkStore(),
    settings: someSettings(),
    address: 'https://films.example',
    defaultName: 'Films',
    peers,
  });

  at.set('https://anime.example', anime);
  at.set('https://films.example', films);

  return { anime, films, at };
};

describe('createLinkService', () => {
  it('makes a key once, and is known by a fingerprint of it', async () => {
    const { anime } = twoServers();
    const first = await anime.identity();
    const again = await anime.identity();

    expect(first.fingerprint).toMatch(/^[0-9a-f]{32}$/u);
    expect(again.fingerprint).toBe(first.fingerprint);
    expect(first).toMatchObject({ name: 'Anime', address: 'https://anime.example' });
    expect(await anime.publicIdentity()).not.toHaveProperty('address');
  });

  it('links two servers once the invited one’s admin approves', async () => {
    const { anime, films } = twoServers();
    const { invite } = await anime.makeInvite();

    const used = await films.useInvite(invite);

    expect(used).toMatchObject({ kind: 'used', server: { name: 'Anime', state: 'awaitingThem' } });

    const asked = (await anime.linking()).servers;

    expect(asked).toEqual([expect.objectContaining({ name: 'Films', state: 'awaitingUs' })]);

    const waiting = used.kind === 'used' ? used.server : null;

    expect((await films.check(waiting?.id ?? ''))?.state).toBe('awaitingThem');

    await anime.approve(asked[0]?.id ?? '');

    expect((await films.check(waiting?.id ?? ''))?.state).toBe('linked');
    expect((await anime.linking()).servers[0]?.state).toBe('linked');
  });

  it('spends an invite once, so a second server cannot use it', async () => {
    const { anime, films, at } = twoServers();
    const third = createLinkService({
      store: createMemoryLinkStore(),
      settings: someSettings(),
      address: 'https://music.example',
      defaultName: 'Music',
      peers: reaching(at),
    });
    const { invite } = await anime.makeInvite();

    await films.useInvite(invite);

    expect(await third.useInvite(invite)).toEqual({ kind: 'refused', why: 'inviteSpent' });
  });

  it('refuses what is not an invite, its own invite, and one whose server has changed its key', async () => {
    const { anime, films, at } = twoServers();

    expect(await films.useInvite('nonsense')).toEqual({ kind: 'refused', why: 'notAnInvite' });

    const own = await films.makeInvite();

    expect(await films.useInvite(own.invite)).toEqual({ kind: 'refused', why: 'itself' });

    const { invite } = await anime.makeInvite();
    const impostor = createLinkService({
      store: createMemoryLinkStore(),
      settings: someSettings(),
      address: 'https://anime.example',
      defaultName: 'Not anime',
      peers: reaching(at),
    });

    at.set('https://anime.example', impostor);

    expect(await films.useInvite(invite)).toEqual({
      kind: 'refused',
      why: 'notTheServerThatInvited',
    });
  });

  it('says a server could not be reached', async () => {
    const { anime, films, at } = twoServers();
    const { invite } = await anime.makeInvite();

    at.delete('https://anime.example');

    expect(await films.useInvite(invite)).toEqual({ kind: 'refused', why: 'unreachable' });
  });

  it('will not link twice with the same server', async () => {
    const { anime, films } = twoServers();

    await films.useInvite((await anime.makeInvite()).invite);

    expect(await films.useInvite((await anime.makeInvite()).invite)).toEqual({
      kind: 'refused',
      why: 'alreadyLinked',
    });
  });

  it('tells the invited server it was refused', async () => {
    const { anime, films } = twoServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);

    await anime.refuse((await anime.linking()).servers[0]?.id ?? '');

    expect((await films.check(used.kind === 'used' ? used.server.id : ''))?.state).toBe('refused');
  });

  it('tells the other server on unlinking, which keeps it to show until its admin forgets it', async () => {
    const { anime, films } = twoServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);

    await anime.approve((await anime.linking()).servers[0]?.id ?? '');
    await films.check(used.kind === 'used' ? used.server.id : '');

    expect(await films.unlink(used.kind === 'used' ? used.server.id : '')).toBe(true);
    expect((await films.linking()).servers).toEqual([]);
    expect((await anime.linking()).servers[0]?.state).toBe('unlinkedByThem');
  });

  it('believes nothing a server did not sign, or signed for another', async () => {
    const { anime, films } = twoServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);
    const pairingId = (await anime.linking()).servers[0]?.id ?? '';

    expect(await anime.pairingState(pairingId, 'not-a-token')).toBeNull();
    expect(await anime.hearUnlinked('not-a-token')).toBe(false);
    expect(used.kind).toBe('used');
  });

  it('withdraws an invite, which then cannot be used', async () => {
    const { anime, films } = twoServers();
    const made = await anime.makeInvite();

    expect(await anime.withdrawInvite(made.id)).toBe(true);
    expect((await anime.linking()).invites).toEqual([]);
    expect(await films.useInvite(made.invite)).toEqual({ kind: 'refused', why: 'inviteSpent' });
  });

  it('changes its name, colour and address', async () => {
    const { anime } = twoServers();

    const changed = await anime.changeIdentity({
      name: 'Kai’s Valence',
      colour: '#e8503a',
      address: 'https://kai.example/',
    });

    expect(changed).toMatchObject({
      name: 'Kai’s Valence',
      colour: '#e8503a',
      address: 'https://kai.example',
    });
  });
});
