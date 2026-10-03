import { describe, expect, it } from 'vitest';
import { NOTHING_SHARED } from '@ValenceContracts/constants/NOTHING_SHARED';
import { createMemoryLinkSharingStore } from './createMemoryLinkSharingStore';

const AT = new Date('2026-10-02T12:00:00.000Z');

const later = (ms: number) => new Date(AT.getTime() + ms);

const aStore = () => createMemoryLinkSharingStore((id) => Promise.resolve(id === 'films'));

describe('createMemoryLinkSharingStore', () => {
  it('shares nothing with a server until its admin chooses, and only with a known one', async () => {
    const store = aStore();

    expect(await store.readSharing('films')).toEqual(NOTHING_SHARED);
    expect(await store.readSharing('nobody')).toBeNull();
    expect(await store.changeSharing('nobody', { showsActivity: true })).toBeNull();
  });

  it('changes only what it is told to', async () => {
    const store = aStore();

    await store.changeSharing('films', { libraryIds: ['anime'], maximumAge: 12 });

    expect(await store.changeSharing('films', { namesTravel: false })).toMatchObject({
      libraryIds: ['anime'],
      maximumAge: 12,
      namesTravel: false,
    });
    expect((await store.changeSharing('films', { maximumAge: null }))?.maximumAge).toBeNull();
  });

  it('knows a person again by their pseudonym, keeping the last name they came with', async () => {
    const store = aStore();
    const first = await store.seePerson('films', 'p1', 'Sam', AT);
    const again = await store.seePerson('films', 'p1', null, later(1000));

    expect(again).toMatchObject({
      id: first.id,
      name: 'Sam',
      lastSeenAt: later(1000).toISOString(),
    });
    expect((await store.seePerson('other', 'p1', null, AT)).id).not.toBe(first.id);
  });

  it('blocks and unblocks a person, but only from their own server', async () => {
    const store = aStore();
    const sam = await store.seePerson('films', 'p1', 'Sam', AT);

    expect((await store.blockPerson('films', sam.id, AT))?.blockedAt).toBe(AT.toISOString());
    expect(await store.blockPerson('other', sam.id, AT)).toBeNull();
    expect((await store.blockPerson('films', sam.id, null))?.blockedAt).toBeNull();
  });

  it('folds the same request again within a minute into one entry, newest first', async () => {
    const store = aStore();
    const sam = await store.seePerson('films', 'p1', 'Sam', AT);
    const playing = {
      linkedServerId: 'films',
      remotePersonId: sam.id,
      action: 'media',
      mediaId: 'arrival',
      mediaTitle: 'Arrival',
      outcome: 'allowed',
    } as const;

    await store.record(playing, AT);
    await store.record(playing, later(30_000));
    await store.record({ ...playing, outcome: 'blocked' }, later(31_000));
    await store.record(playing, later(120_000));

    const entries = await store.listActivity('films', { limit: 10 });

    expect(entries.map((entry) => [entry.outcome, entry.count])).toEqual([
      ['allowed', 1],
      ['blocked', 1],
      ['allowed', 2],
    ]);
    expect(entries[0]?.personName).toBe('Sam');
    expect(await store.listActivity('films', { limit: 10, since: later(100_000) })).toHaveLength(1);
    expect(await store.listActivity('films', { limit: 10, personIds: [] })).toEqual([]);
  });
});
