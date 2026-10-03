import { describe, expect, it } from 'vitest';
import { createMemoryLinkStore } from './createMemoryLinkStore';

const A_KEY = { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' } as const;

describe('createMemoryLinkStore', () => {
  it('spends an open invite once, and never one that has run out', async () => {
    const store = createMemoryLinkStore();
    const now = new Date('2026-10-02T12:00:00.000Z');

    await store.addInvite('open', new Date('2026-10-03T12:00:00.000Z'));
    await store.addInvite('gone', new Date('2026-10-01T12:00:00.000Z'));

    expect(await store.listInvites(now)).toHaveLength(1);
    expect(await store.spendInvite('open', now)).toBe(true);
    expect(await store.spendInvite('open', now)).toBe(false);
    expect(await store.spendInvite('gone', now)).toBe(false);
    expect(await store.listInvites(now)).toEqual([]);
  });

  it('keeps a server, finds it by fingerprint, changes and forgets it', async () => {
    const store = createMemoryLinkStore();
    const added = await store.addServer({
      name: 'Anime',
      colour: '#3a8ee8',
      address: 'https://anime.example',
      publicKey: A_KEY,
      fingerprint: 'abcd',
      state: 'awaitingUs',
      theirPairingId: null,
    });

    expect(await store.readServerByFingerprint('abcd')).toEqual(added);

    const linked = await store.changeServer(added.id, { state: 'linked', linkedAt: new Date() });

    expect(linked?.state).toBe('linked');
    expect(linked?.linkedAt).not.toBeNull();
    expect(await store.removeServer(added.id)).toBe(true);
    expect(await store.listServers()).toEqual([]);
  });
});
