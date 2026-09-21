import { describe, expect, it, vi } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { createRequestService } from './createRequestService';
import type { MediaRequestDraft } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const AT = new Date('2026-09-19T00:00:00.000Z');

const DUNE: MediaRequestDraft = {
  kind: 'film',
  tmdbId: 438631,
  libraryId: 'films',
  libraryPath: '/media/Films',
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: false,
  catalogue: {
    title: 'Dune',
    year: 2021,
    releaseDates: { theatrical: '2021-10-22', digital: '2021-12-03', physical: null },
  },
};

const SEVERANCE: MediaRequestDraft = {
  kind: 'series',
  tmdbId: 95396,
  libraryId: 'series',
  libraryPath: '/media/Series',
  seasons: [1],
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: true,
  catalogue: {
    title: 'Severance',
    year: 2022,
    episodes: [
      { season: 1, episode: 1, title: 'Good News About Hell', airDate: '2022-02-18' },
      { season: 2, episode: 1, title: 'Hello, Ms. Cobel', airDate: '2025-01-17' },
    ],
  },
};

const PINK_FLOYD: MediaRequestDraft = {
  kind: 'artist',
  musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
  libraryId: 'music',
  libraryPath: '/media/Music',
  releaseTypes: ['album'],
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: true,
  catalogue: {
    title: 'Pink Floyd',
    year: null,
    artist: 'Pink Floyd',
    albums: [
      {
        id: 'a4c2e8f0-9d1b-3c5e-8f7a-2b4d6e8f0a1c',
        title: 'The Wall',
        type: 'album',
        firstReleased: '1979-11-30',
      },
      {
        id: 'b3c6d2f6-1f0b-3a5d-8c2e-6e0f5b1a2c3d',
        title: 'Pulse',
        type: 'live',
        firstReleased: '1995-05-29',
      },
    ],
  },
};

/**
 * A service over stores in memory.
 */
const aService = () => {
  const requests = createMemoryRecordStore<MediaRequestRecord>();
  const items = createMemoryRecordStore<RequestItemRecord>();
  const onChange = vi.fn();

  return {
    service: createRequestService({ requests, items, now: () => AT, onChange }),
    items,
    onChange,
  };
};

const PROJECT_HAIL_MARY: MediaRequestDraft = {
  kind: 'book',
  openLibraryId: 21_277_329,
  libraryId: 'books',
  libraryPath: '/media/Books',
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: true,
  catalogue: { title: 'Project Hail Mary', year: 2021, artist: 'Andy Weir' },
};

describe('createRequestService', () => {
  it('makes a request waiting on approval, for a film held until its release', async () => {
    const { service, onChange } = aService();

    const { request, isNew } = await service.add(DUNE);

    expect(isNew).toBe(true);
    expect(request).toMatchObject({
      title: 'Dune',
      state: 'awaitingApproval',
      releaseDate: '2021-12-03',
      requestedBy: { id: 'someone', name: 'Someone' },
    });
    expect(request.items).toMatchObject([{ season: null, state: 'waiting' }]);
    expect(onChange).toHaveBeenCalled();
  });

  it('adds to a request already made for the same title, approving it where the asker may', async () => {
    const { service } = aService();

    await service.add({ ...SEVERANCE, isApproved: false });

    const { request, isNew } = await service.add({ ...SEVERANCE, seasons: [2] });

    expect(isNew).toBe(false);
    expect(request.approval).toBe('approved');
    expect(request.seasons).toEqual([1, 2]);
    expect(request.items.map((item) => item.title)).toEqual([
      'Good News About Hell',
      'Hello, Ms. Cobel',
    ]);
    expect(await service.list()).toHaveLength(1);
  });

  it('keeps the quality asked for, and changes it', async () => {
    const { service } = aService();
    const profileId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const { request } = await service.add({ ...DUNE, profileId });

    expect(request.profileId).toBe(profileId);
    expect((await service.add(DUNE)).request.profileId).toBe(profileId);
    expect((await service.change(request.id, { profileId: null }, null))?.profileId).toBeNull();
  });

  it('keeps whether its release is picked by hand, and changes it', async () => {
    const { service } = aService();
    const { request } = await service.add({ ...DUNE, isPickedByHand: true });

    expect(request.isPickedByHand).toBe(true);
    expect((await service.add(DUNE)).request.isPickedByHand).toBe(true);
    expect(
      (await service.change(request.id, { isPickedByHand: false }, null))?.isPickedByHand,
    ).toBe(false);
  });

  it('approves and refuses', async () => {
    const { service } = aService();
    const { request } = await service.add(DUNE);

    expect((await service.approve(request.id))?.approval).toBe('approved');
    expect(await service.refuse(request.id, 'Not in this house')).toMatchObject({
      state: 'refused',
      refusedBecause: 'Not in this house',
    });
    expect(await service.approve('missing')).toBeNull();
  });

  it('changes the seasons asked for with what the catalogue says', async () => {
    const { service } = aService();
    const { request } = await service.add(SEVERANCE);

    const changed = await service.change(request.id, { seasons: [2] }, SEVERANCE.catalogue);

    expect(changed?.items.map((item) => item.season)).toEqual([2]);
    expect(await service.change('missing', {}, null)).toBeNull();
  });

  it('names the quality a request is judged at, so whoever reads it need not look up an id', async () => {
    const requests = createMemoryRecordStore<MediaRequestRecord>();
    const items = createMemoryRecordStore<RequestItemRecord>();
    const service = createRequestService({
      requests,
      items,
      profiles: {
        list: () => Promise.resolve([aProfile({ name: 'Ultra HD', libraryIds: ['films'] })]),
      },
      now: () => AT,
    });

    const { request } = await service.add(DUNE);

    expect(request.profileName).toBe('Ultra HD');
    expect((await service.list())[0]?.profileName).toBe('Ultra HD');
    expect((await service.find(request.id))?.profileName).toBe('Ultra HD');
  });

  it('names no quality where no profile covers the request', async () => {
    const { service } = aService();
    const { request } = await service.add(DUNE);

    expect(request.profileName).toBeNull();
  });

  it('holds a film until it is out in the way its quality profile says', async () => {
    const requests = createMemoryRecordStore<MediaRequestRecord>();
    const items = createMemoryRecordStore<RequestItemRecord>();
    const service = createRequestService({
      requests,
      items,
      profiles: {
        list: () => Promise.resolve([aProfile({ releaseWait: 'physical', libraryIds: ['films'] })]),
      },
      now: () => AT,
    });
    const { request } = await service.add({
      ...DUNE,
      catalogue: {
        ...DUNE.catalogue,
        releaseDates: { theatrical: null, digital: '2021-12-03', physical: '2022-01-11' },
      },
    });

    expect(request.releaseDate).toBe('2022-01-11');
  });

  it('brings a request up to date with the catalogue and its library', async () => {
    const { service } = aService();
    const { request } = await service.add({ ...SEVERANCE, seasons: null });

    const updated = await service.updateCatalogue(request.id, {
      catalogue: {
        ...SEVERANCE.catalogue,
        episodes: [
          ...(SEVERANCE.catalogue.episodes ?? []),
          { season: 3, episode: 1, title: 'New', airDate: '2027-01-01' },
        ],
      },
      libraryPath: '/media/TV',
    });

    expect(updated?.items).toHaveLength(3);
    expect(await service.updateCatalogue('missing', { catalogue: DUNE.catalogue })).toBeNull();
  });

  it('follows what may still change: series still running, and films not yet fetched', async () => {
    const { service } = aService();
    const film = await service.add(DUNE);
    const series = await service.add(SEVERANCE);

    await service.add({
      ...SEVERANCE,
      tmdbId: 1,
      catalogue: { ...SEVERANCE.catalogue, isEnded: true },
    });
    await service.refuse(film.request.id, '');

    expect(await service.following()).toEqual([
      {
        id: series.request.id,
        kind: 'series',
        tmdbId: 95396,
        musicBrainzId: null,
        openLibraryId: null,
        libraryId: 'series',
      },
    ]);
  });

  it('watches an artist for albums of the kinds asked for, adding kinds asked for again', async () => {
    const { service } = aService();

    const first = await service.add(PINK_FLOYD);

    expect(first.request).toMatchObject({
      kind: 'artist',
      title: 'Pink Floyd',
      artistName: 'Pink Floyd',
      musicBrainzId: PINK_FLOYD.musicBrainzId,
      tmdbId: null,
      releaseTypes: ['album'],
      state: 'waiting',
    });
    expect(first.request.items.map((item) => item.title)).toEqual(['The Wall']);

    const again = await service.add({ ...PINK_FLOYD, releaseTypes: ['live'] });

    expect(again.isNew).toBe(false);
    expect(again.request.releaseTypes).toEqual(['album', 'live']);
    expect(again.request.items.map((item) => item.title)).toEqual(['The Wall', 'Pulse']);
    expect(await service.following()).toEqual([
      {
        id: first.request.id,
        kind: 'artist',
        tmdbId: null,
        musicBrainzId: PINK_FLOYD.musicBrainzId,
        openLibraryId: null,
        libraryId: 'music',
      },
    ]);
  });

  it('asks for a book by its Open Library id, with nothing to wait for but somebody to add it', async () => {
    const { service } = aService();

    const { request } = await service.add(PROJECT_HAIL_MARY);

    expect(request).toMatchObject({
      kind: 'book',
      title: 'Project Hail Mary',
      artistName: 'Andy Weir',
      openLibraryId: 21_277_329,
      tmdbId: null,
      musicBrainzId: null,
      state: 'waiting',
    });
    expect(request.items).toMatchObject([{ title: 'Project Hail Mary', airDate: null }]);
  });

  it('adds to a request already made for the same book rather than making another', async () => {
    const { service } = aService();

    await service.add(PROJECT_HAIL_MARY);

    const again = await service.add({ ...PROJECT_HAIL_MARY, requestedBy: { id: 'x', name: 'X' } });

    expect(again.isNew).toBe(false);
    expect(await service.list()).toHaveLength(1);
  });

  it('keeps a book and a film with the same number apart', async () => {
    const { service } = aService();

    await service.add(PROJECT_HAIL_MARY);
    await service.add({ ...DUNE, tmdbId: 21_277_329 });

    expect(await service.list()).toHaveLength(2);
  });

  it('follows a book that has not been filed, and stops when it has been', async () => {
    const { service } = aService();
    const { request } = await service.add(PROJECT_HAIL_MARY);

    expect(await service.following()).toEqual([
      {
        id: request.id,
        kind: 'book',
        tmdbId: null,
        musicBrainzId: null,
        openLibraryId: 21_277_329,
        libraryId: 'books',
      },
    ]);
  });

  it('asks for one album on its own, apart from its artist', async () => {
    const { service } = aService();

    await service.add(PINK_FLOYD);

    const { request, isNew } = await service.add({
      ...PINK_FLOYD,
      kind: 'album',
      musicBrainzId: 'b3c6d2f6-1f0b-3a5d-8c2e-6e0f5b1a2c3d',
      releaseTypes: null,
      catalogue: { ...PINK_FLOYD.catalogue, title: 'Pulse' },
    });

    expect(isNew).toBe(true);
    expect(request).toMatchObject({ kind: 'album', title: 'Pulse', releaseDate: '1995-05-29' });
    expect(request.items.map((item) => item.title)).toEqual(['Pulse']);
  });

  it('marks everything a request waits on available once somebody has met it by hand', async () => {
    const { service } = aService();
    const { request } = await service.add(PROJECT_HAIL_MARY);

    const met = await service.fulfil(request.id);

    expect(met?.state).toBe('available');
    expect(met?.items.every((item) => item.state === 'available')).toBe(true);
  });

  it('says nothing of meeting a request that is not there', async () => {
    const { service } = aService();

    expect(await service.fulfil('9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b')).toBeNull();
  });

  it('tries again what failed, and marks what was filed arrived', async () => {
    const { service, items } = aService();
    const { request } = await service.add({ ...DUNE, isApproved: true });
    const [item] = await items.list();

    await items.update(item?.id ?? '', { state: 'failed', problem: 'It went wrong', attempts: 3 });

    expect((await service.retry(request.id))?.items[0]).toMatchObject({
      state: 'wanted',
      problem: null,
    });

    await items.update(item?.id ?? '', { state: 'filed' });

    expect(await service.arrived(request.id, 'media-1')).toMatchObject({
      state: 'available',
      mediaId: 'media-1',
    });
    expect(await service.retry('missing')).toBeNull();
  });

  it('removes a request and what it waited for', async () => {
    const { service, items } = aService();
    const { request } = await service.add(SEVERANCE);

    expect(await service.remove(request.id)).toBe(true);
    expect(await items.list()).toEqual([]);
    expect(await service.find(request.id)).toBeNull();
  });
});
