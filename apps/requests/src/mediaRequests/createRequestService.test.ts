import { describe, expect, it, vi } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
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

  it('holds a film until the release the admin now chooses', async () => {
    const { service } = aService();
    const { request } = await service.add({
      ...DUNE,
      catalogue: {
        ...DUNE.catalogue,
        releaseDates: { theatrical: null, digital: '2021-12-03', physical: '2022-01-11' },
      },
    });

    expect(
      (await service.change(request.id, { waitFor: 'physical' }, null))?.items[0]?.airDate,
    ).toBe('2022-01-11');
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
      { id: series.request.id, kind: 'series', tmdbId: 95396, libraryId: 'series' },
    ]);
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
