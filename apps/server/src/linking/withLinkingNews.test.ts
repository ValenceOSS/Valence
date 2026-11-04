import { describe, expect, it, vi } from 'vitest';
import { createMemoryLinkStore } from './createMemoryLinkStore';
import { withLinkingNews } from './withLinkingNews';

const A_KEY = { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' } as const;

const SERVER = {
  name: 'Elsewhere',
  colour: '#3a8ee8',
  address: 'https://elsewhere.example',
  publicKey: A_KEY,
  fingerprint: 'abcd',
  state: 'awaitingUs',
  theirPairingId: null,
} as const;

const NOW = new Date('2026-11-04T12:00:00.000Z');

const LATER = new Date('2026-11-05T12:00:00.000Z');

describe('withLinkingNews', () => {
  it('tells once of each change to an invite, and answers as the store did', async () => {
    const tell = vi.fn();
    const store = withLinkingNews(createMemoryLinkStore(), tell);

    const kept = await store.addInvite('kept', LATER);

    await store.addInvite('spent', LATER);

    expect(tell).toHaveBeenCalledTimes(2);
    expect(await store.spendInvite('spent', NOW)).toBe(true);
    expect(tell).toHaveBeenCalledTimes(3);
    expect(await store.withdrawInvite(kept.id)).toBe(true);
    expect(tell).toHaveBeenCalledTimes(4);
  });

  it('tells once of each change to a server and what is shared with it', async () => {
    const tell = vi.fn();
    const store = withLinkingNews(createMemoryLinkStore(), tell);

    const added = await store.addServer(SERVER);
    const changed = await store.changeServer(added.id, { state: 'linked' });

    await store.declineLibrary(added.id, 'library-1', true);

    expect(changed?.state).toBe('linked');
    expect(await store.removeServer(added.id)).toBe(true);
    expect(tell).toHaveBeenCalledTimes(4);
  });

  it('tells of nothing when the store is only read', async () => {
    const tell = vi.fn();
    const store = withLinkingNews(createMemoryLinkStore(), tell);

    await store.listInvites(NOW);
    await store.listServers();
    await store.readServer('nobody');
    await store.readServerByFingerprint('abcd');
    await store.listDeclined('nobody');

    expect(tell).not.toHaveBeenCalled();
  });
});
