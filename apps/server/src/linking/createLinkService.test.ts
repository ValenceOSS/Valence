import { describe, expect, it } from 'vitest';
import { someLinkSettings } from '@ValenceServer/testing/someLinkSettings';
import { twoLinkingServers } from '@ValenceServer/testing/twoLinkingServers';
import { createLinkService } from './createLinkService';

describe('createLinkService', () => {
  it('makes a key once, and is known by a fingerprint of it', async () => {
    const { anime } = twoLinkingServers();
    const first = await anime.identity();
    const again = await anime.identity();

    expect(first.fingerprint).toMatch(/^[0-9a-f]{32}$/u);
    expect(again.fingerprint).toBe(first.fingerprint);
    expect(first).toMatchObject({ name: 'Anime', address: 'https://anime.example' });
    expect(await anime.publicIdentity()).not.toHaveProperty('address');
  });

  it('links two servers once the invited one’s admin approves', async () => {
    const { anime, films } = twoLinkingServers();
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
    const { anime, films, add } = twoLinkingServers();
    const third = add('https://music.example', 'Music');
    const { invite } = await anime.makeInvite();

    await films.useInvite(invite);

    expect(await third.useInvite(invite)).toEqual({ kind: 'refused', why: 'inviteSpent' });
  });

  it('refuses what is not an invite, its own invite, and one whose server has changed its key', async () => {
    const { anime, films, add } = twoLinkingServers();

    expect(await films.useInvite('nonsense')).toEqual({ kind: 'refused', why: 'notAnInvite' });

    const own = await films.makeInvite();

    expect(await films.useInvite(own.invite)).toEqual({ kind: 'refused', why: 'itself' });

    const { invite } = await anime.makeInvite();

    add('https://anime.example', 'Not anime');

    expect(await films.useInvite(invite)).toEqual({
      kind: 'refused',
      why: 'notTheServerThatInvited',
    });
  });

  it('says a server could not be reached', async () => {
    const { anime, films, at } = twoLinkingServers();
    const { invite } = await anime.makeInvite();

    at.delete('https://anime.example');

    expect(await films.useInvite(invite)).toEqual({ kind: 'refused', why: 'unreachable' });
  });

  it('will not link twice with the same server', async () => {
    const { anime, films } = twoLinkingServers();

    await films.useInvite((await anime.makeInvite()).invite);

    expect(await films.useInvite((await anime.makeInvite()).invite)).toEqual({
      kind: 'refused',
      why: 'alreadyLinked',
    });
  });

  it('tells the invited server it was refused', async () => {
    const { anime, films } = twoLinkingServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);

    await anime.refuse((await anime.linking()).servers[0]?.id ?? '');

    expect((await films.check(used.kind === 'used' ? used.server.id : ''))?.state).toBe('refused');
  });

  it('tells the other server on unlinking, and each keeps it to show until its admin forgets it', async () => {
    const { anime, films } = twoLinkingServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);

    await anime.approve((await anime.linking()).servers[0]?.id ?? '');
    await films.check(used.kind === 'used' ? used.server.id : '');

    expect(await films.unlink(used.kind === 'used' ? used.server.id : '')).toBe(true);
    expect((await films.linking()).servers[0]?.state).toBe('unlinked');
    expect((await anime.linking()).servers[0]?.state).toBe('unlinkedByThem');
  });

  it('believes nothing a server did not sign, or signed for another', async () => {
    const { anime, films } = twoLinkingServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);
    const pairingId = (await anime.linking()).servers[0]?.id ?? '';

    expect(await anime.pairingState(pairingId, 'not-a-token')).toBeNull();
    expect(await anime.hearUnlinked('not-a-token')).toBe(false);
    expect(used.kind).toBe('used');
  });

  it('withdraws an invite, which then cannot be used', async () => {
    const { anime, films } = twoLinkingServers();
    const made = await anime.makeInvite();

    expect(await anime.withdrawInvite(made.id)).toBe(true);
    expect((await anime.linking()).invites).toEqual([]);
    expect(await films.useInvite(made.invite)).toEqual({ kind: 'refused', why: 'inviteSpent' });
  });

  it('changes its name, colour and address', async () => {
    const { anime } = twoLinkingServers();

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

  it('signs for a linked server, as one of its people where it is asking for one', async () => {
    const { anime, films, link } = twoLinkingServers();
    const { filmsAtAnime, animeAtFilms } = await link();
    const pseudonym = await films.pseudonymFor(animeAtFilms, 'sam');
    const signed = await films.signFor(animeAtFilms, { pseudonym, name: 'Sam' });

    expect(signed?.address).toBe('https://anime.example');
    expect(await anime.readToken(signed?.token ?? '')).toEqual({
      from: (await films.identity()).fingerprint,
      person: { pseudonym, name: 'Sam' },
    });
    expect(await films.pseudonymFor(animeAtFilms, 'sam')).toBe(pseudonym);
    expect(await films.pseudonymFor(animeAtFilms, 'kai')).not.toBe(pseudonym);
    expect(await anime.signFor('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(filmsAtAnime).not.toBe('');
  });

  it('makes one key however many ask for it at once on a fresh server', async () => {
    const { anime } = twoLinkingServers();
    const [one, two, three] = await Promise.all([
      anime.identity(),
      anime.makeInvite(),
      anime.identity(),
    ]);

    expect(two.invite).toBeTruthy();
    expect(three.fingerprint).toBe(one.fingerprint);
    expect((await anime.identity()).fingerprint).toBe(one.fingerprint);
  });

  it('keeps waiting on a server that is briefly unwell, rather than reading it as unlinked', async () => {
    const { anime, films, filmsStore } = twoLinkingServers();
    const used = await films.useInvite((await anime.makeInvite()).invite);
    const waiting = used.kind === 'used' ? used.server.id : '';
    const answering = (code: string) =>
      createLinkService({
        store: filmsStore,
        settings: someLinkSettings(),
        address: 'https://films.example',
        defaultName: 'Films',
        peers: {
          identityAt: () => Promise.resolve(null),
          pair: () => Promise.resolve({ kind: 'unreachable' }),
          pairingState: () => Promise.resolve({ kind: 'refused', code }),
          tellUnlinked: () => Promise.resolve(false),
          tellChanged: () => Promise.resolve(false),
          libraries: () => Promise.resolve({ kind: 'unreachable' }),
          activity: () => Promise.resolve({ kind: 'unreachable' }),
          catalogue: () => Promise.resolve({ kind: 'unreachable' }),
          passThrough: () => Promise.resolve(null),
        },
      });

    expect((await answering('error.common.somethingWentWrong').check(waiting))?.state).toBe(
      'awaitingThem',
    );
    expect((await answering('error.linking.notSignedByALinkedServer').check(waiting))?.state).toBe(
      'unlinkedByThem',
    );
  });
});
