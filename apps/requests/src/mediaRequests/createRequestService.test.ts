import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
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
    requests,
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

  it('keeps somebody else asking among those who asked, without approving it for everyone', async () => {
    const { service } = aService();

    await service.add(DUNE);

    const { request, isNew } = await service.add({
      ...DUNE,
      requestedBy: { id: 'another', name: 'Another' },
      isApproved: true,
    });

    expect(isNew).toBe(false);
    expect(request.approval).toBe('awaiting');
    expect(request.requestedBy).toEqual({ id: 'someone', name: 'Someone' });
    expect(request.alsoAskedBy).toEqual([{ id: 'another', name: 'Another' }]);

    const again = await service.add({ ...DUNE, requestedBy: { id: 'another', name: 'Another' } });

    expect(again.request.alsoAskedBy).toHaveLength(1);
  });

  it('joins somebody to a request, once', async () => {
    const { service } = aService();
    const { request } = await service.add(DUNE);

    await service.join(request.id, { id: 'another', name: 'Another' });
    const joined = await service.join(request.id, { id: 'another', name: 'Another' });

    expect(joined?.alsoAskedBy).toEqual([{ id: 'another', name: 'Another' }]);
    expect(await service.join(request.id, { id: 'someone', name: 'Someone' })).toMatchObject({
      alsoAskedBy: [{ id: 'another', name: 'Another' }],
    });
    expect(await service.join('nowhere', { id: 'another', name: 'Another' })).toBeNull();
  });

  it('takes one asker off a request, the next becoming the first where the first leaves', async () => {
    const { service } = aService();
    const { request } = await service.add(DUNE);

    await service.join(request.id, { id: 'another', name: 'Another' });
    await service.join(request.id, { id: 'third', name: 'Third' });

    const left = await service.leave(request.id, 'someone');

    expect(left?.requestedBy).toEqual({ id: 'another', name: 'Another' });
    expect(left?.alsoAskedBy).toEqual([{ id: 'third', name: 'Third' }]);

    const leftAgain = await service.leave(request.id, 'third');

    expect(leftAgain?.requestedBy).toEqual({ id: 'another', name: 'Another' });
    expect(leftAgain?.alsoAskedBy).toEqual([]);
  });

  it('leaves the last asker on, and nobody who did not ask', async () => {
    const { service } = aService();
    const { request } = await service.add(DUNE);

    expect(await service.leave(request.id, 'someone')).toBeNull();

    await service.join(request.id, { id: 'another', name: 'Another' });

    expect(await service.leave(request.id, 'stranger')).toBeNull();
    expect(await service.find(request.id)).toMatchObject({
      alsoAskedBy: [{ id: 'another', name: 'Another' }],
    });
  });

  it('waits for the operator on a later ask at a higher profile, then switches or keeps', async () => {
    const requests = createMemoryRecordStore<MediaRequestRecord>();
    const items = createMemoryRecordStore<RequestItemRecord>();
    const uhd = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'UHD', position: 0 });
    const hd = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'HD', position: 1 });
    const service = createRequestService({
      requests,
      items,
      profiles: { list: () => Promise.resolve([uhd, hd]) },
      now: () => AT,
    });
    const { request } = await service.add({ ...DUNE, profileId: hd.id });

    const later = await service.add({
      ...DUNE,
      profileId: uhd.id,
      requestedBy: { id: 'priya', name: 'Priya' },
    });

    expect(later.request.profileId).toBe(hd.id);
    expect(later.request.profileAsk).toEqual({
      asker: { id: 'priya', name: 'Priya' },
      profileId: uhd.id,
      profileName: 'UHD',
    });
    expect(later.request.alsoAskedBy).toEqual([
      { id: 'priya', name: 'Priya', profileId: uhd.id, profileName: 'UHD' },
    ]);

    const switched = await service.decideProfileAsk(request.id, { choice: 'switch' });

    expect(switched).toMatchObject({ profileId: uhd.id, profileAsk: null });
    expect(await service.decideProfileAsk(request.id, { choice: 'keep' })).toBeNull();
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

  it('wants lossless copies of an artist’s lossy albums once told to, and lets them be once not', async () => {
    const { service } = aService();
    const { request } = await service.add(PINK_FLOYD);
    const held = {
      mediaId: null,
      episodes: [],
      folder: null,
      seasonFolders: [],
      albums: [{ id: 'a4c2e8f0-9d1b-3c5e-8f7a-2b4d6e8f0a1c', quality: 'mp3' as const }],
    };

    const wanting = await service.change(
      request.id,
      { upgradesToLossless: true },
      PINK_FLOYD.catalogue,
      held,
    );

    expect(wanting?.upgradesToLossless).toBe(true);
    expect(wanting?.items).toMatchObject([{ title: 'The Wall', heldQuality: 'mp3' }]);

    const letting = await service.change(
      request.id,
      { upgradesToLossless: false },
      PINK_FLOYD.catalogue,
      held,
    );

    expect(letting?.items).toMatchObject([{ state: 'available', heldQuality: null }]);
  });

  it('asks which narration of an audiobook to fetch, and waits for each one chosen', async () => {
    const { service } = aService();
    const { request } = await service.add({
      kind: 'book',
      openLibraryId: 1,
      libraryId: 'books',
      libraryPath: '/media/Books',
      bookFormats: ['audiobook'],
      requestedBy: { id: 'someone', name: 'Someone' },
      isApproved: true,
      catalogue: {
        title: 'A Book',
        year: null,
        narrations: [
          { asin: 'A', narrators: ['Ann Reader'], runtimeMinutes: 600, series: null },
          { asin: 'B', narrators: ['Bob Voice'], runtimeMinutes: 610, series: null },
        ],
      },
    });

    expect(request.isAskingNarration).toBe(true);
    expect(await service.decideNarration(request.id, ['Z'])).toBeNull();

    const chosen = await service.decideNarration(request.id, ['A', 'B']);

    expect(chosen?.isAskingNarration).toBe(false);
    expect(chosen?.items.map((item) => item.narration).toSorted()).toEqual(['A', 'B']);
  });

  it('changes the seasons asked for with what the catalogue says', async () => {
    const { service } = aService();
    const { request } = await service.add(SEVERANCE);

    const changed = await service.change(request.id, { seasons: [2] }, SEVERANCE.catalogue);

    expect(changed?.items.map((item) => item.season)).toEqual([2]);
    expect(await service.change('missing', {}, null)).toBeNull();
  });

  it('follows the seasons that come after those there were when it was asked for', async () => {
    const { service } = aService();
    const firstSeason = {
      ...SEVERANCE.catalogue,
      episodes: SEVERANCE.catalogue.episodes?.filter((episode) => episode.season === 1),
    };
    const following = await service.add({ ...SEVERANCE, catalogue: firstSeason });
    const later = await service.change(following.request.id, {}, SEVERANCE.catalogue);

    expect(following.request.followsNewSeasons).toBe(true);
    expect(later?.items.map((item) => item.season)).toEqual([1, 2]);
  });

  it('follows no new season where it was asked not to', async () => {
    const { service } = aService();
    const firstSeason = {
      ...SEVERANCE.catalogue,
      episodes: SEVERANCE.catalogue.episodes?.filter((episode) => episode.season === 1),
    };
    const { request } = await service.add({
      ...SEVERANCE,
      followsNewSeasons: false,
      catalogue: firstSeason,
    });
    const later = await service.change(request.id, {}, SEVERANCE.catalogue);

    expect(later?.items.map((item) => item.season)).toEqual([1]);
  });

  it('keeps a new season it picked up when more is asked, or following stops', async () => {
    const { service } = aService();
    const firstSeason = {
      ...SEVERANCE.catalogue,
      episodes: SEVERANCE.catalogue.episodes?.filter((episode) => episode.season === 1),
    };
    const { request } = await service.add({ ...SEVERANCE, catalogue: firstSeason });

    await service.change(request.id, {}, SEVERANCE.catalogue);

    const more = await service.add({ ...SEVERANCE, followsNewSeasons: false });

    expect(more.request.seasons).toEqual([1, 2]);
    expect(more.request.followsNewSeasons).toBe(true);

    const stopped = await service.change(
      request.id,
      { followsNewSeasons: false },
      SEVERANCE.catalogue,
    );

    expect(stopped?.followsNewSeasons).toBe(false);
    expect(stopped?.seasons).toEqual([1, 2]);
    expect(stopped?.items.map((item) => item.season)).toEqual([1, 2]);
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

  it('marks there what the library already holds of a series, and keeps where it keeps it', async () => {
    const { service, requests } = aService();
    const held = {
      mediaId: 'show',
      episodes: [{ season: 1, episode: 1 }],
      folder: '/media/Series/Show',
      seasonFolders: [{ season: 1, folder: '/media/Series/Show/Season 1' }],
    };

    const { request } = await service.add({ ...SEVERANCE, seasons: null, held });

    expect(request.mediaId).toBe('show');
    expect(request.items.map((item) => [item.season, item.state])).toEqual([
      [1, 'available'],
      [2, 'waiting'],
    ]);
    expect(await requests.find(request.id)).toMatchObject({
      libraryFolder: '/media/Series/Show',
      seasonFolders: [{ season: 1, folder: '/media/Series/Show/Season 1' }],
    });
  });

  it('marks there what the library has come to hold when brought up to date', async () => {
    const { service, requests } = aService();
    const { request } = await service.add({ ...SEVERANCE, seasons: null });

    const updated = await service.updateCatalogue(request.id, {
      catalogue: SEVERANCE.catalogue,
      held: {
        mediaId: 'show',
        episodes: [{ season: 2, episode: 1 }],
        folder: '/media/Series/Show',
      },
    });

    expect(updated?.items.map((item) => [item.season, item.state])).toEqual([
      [1, 'waiting'],
      [2, 'available'],
    ]);
    expect(await requests.find(request.id)).toMatchObject({ libraryFolder: '/media/Series/Show' });

    await service.updateCatalogue(request.id, { catalogue: SEVERANCE.catalogue });

    expect(await requests.find(request.id)).toMatchObject({ libraryFolder: '/media/Series/Show' });
  });

  it('marks there what the library holds of seasons added to a request', async () => {
    const { service } = aService();
    const { request } = await service.add(SEVERANCE);

    const changed = await service.change(request.id, { seasons: [1, 2] }, SEVERANCE.catalogue, {
      mediaId: 'show',
      episodes: [{ season: 2, episode: 1 }],
      folder: null,
      seasonFolders: [],
    });

    expect(changed?.items.map((item) => [item.season, item.state])).toEqual([
      [1, 'waiting'],
      [2, 'available'],
    ]);
  });

  it('keeps nothing of a library holding for a film', async () => {
    const { service, requests } = aService();
    const { request } = await service.add({
      ...DUNE,
      held: { mediaId: 'film', folder: '/media/Films/Film' },
    });

    expect(await requests.find(request.id)).toMatchObject({
      libraryFolder: null,
      seasonFolders: [],
      mediaId: null,
    });
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

  it('waits for each format of a book asked for, adds a format asked later, and lets one go', async () => {
    const { service } = aService();

    const { request } = await service.add(PROJECT_HAIL_MARY);

    expect(request.bookFormats).toEqual(['ebook']);
    expect(request.items.map((item) => item.format)).toEqual(['ebook']);

    const again = await service.add({
      ...PROJECT_HAIL_MARY,
      bookFormats: ['audiobook'],
      requestedBy: { id: 'x', name: 'X' },
    });

    expect(again.request.bookFormats).toEqual(['ebook', 'audiobook']);
    expect(again.request.items.map((item) => item.format).toSorted()).toEqual([
      'audiobook',
      'ebook',
    ]);

    const changed = await service.change(request.id, { bookFormats: ['audiobook'] }, null);

    expect(changed?.items.map((item) => item.format)).toEqual(['audiobook']);
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

    await items.update(item?.id ?? '', {
      state: 'failed',
      problem: sayVerbatim('It went wrong'),
      attempts: 3,
    });

    expect((await service.retry(request.id))?.items[0]).toMatchObject({
      state: 'wanted',
      problem: null,
    });

    await items.update(item?.id ?? '', { state: 'filed' });

    expect(await service.arrived(request.id, 'media-1')).toMatchObject({
      request: { state: 'available', mediaId: 'media-1' },
      newlyAvailable: 1,
    });
    expect(await service.arrived(request.id, 'media-1')).toMatchObject({ newlyAvailable: 0 });
    expect(await service.retry('missing')).toBeNull();
  });

  it('keeps both versions of a film, each arriving on its own and only once filed', async () => {
    const requests = createMemoryRecordStore<MediaRequestRecord>();
    const items = createMemoryRecordStore<RequestItemRecord>();
    const uhd = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'UHD', position: 0 });
    const hd = aProfile({ id: '3fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'HD', position: 1 });
    const service = createRequestService({
      requests,
      items,
      profiles: { list: () => Promise.resolve([uhd, hd]) },
      now: () => AT,
    });
    const { request } = await service.add({ ...DUNE, profileId: hd.id, isApproved: true });

    await service.add({ ...DUNE, profileId: uhd.id, requestedBy: { id: 'priya', name: 'Priya' } });

    const both = await service.decideProfileAsk(request.id, { choice: 'both' });

    expect(both?.versions).toEqual([uhd.id]);
    expect(both?.items.map((item) => item.versionProfileId ?? null)).toEqual([null, uhd.id]);

    const [first, version] = await items.list();

    await items.update(first?.id ?? '', { state: 'filed' });

    expect(
      await service.arrivedInLibrary(request.id, {
        mediaId: 'media-1',
        episodes: null,
        albums: null,
      }),
    ).toMatchObject({ request: { state: 'available' }, newlyAvailable: 1, versionsArrived: [] });
    expect((await items.find(version?.id ?? ''))?.state).not.toBe('available');

    await items.update(version?.id ?? '', { state: 'filed' });

    expect(await service.arrived(request.id, 'media-1')).toMatchObject({
      newlyAvailable: 0,
      versionsArrived: [uhd.id],
    });
  });

  it('follows a request’s item to another the library found it as', async () => {
    const { service, items } = aService();
    const { request } = await service.add({ ...DUNE, isApproved: true });
    const [item] = await items.list();

    await items.update(item?.id ?? '', { state: 'filed' });
    await service.arrived(request.id, 'media-1');

    expect(await service.left(request.id, 'media-2')).toMatchObject({
      state: 'available',
      mediaId: 'media-2',
    });
  });

  it('shows what left the library as failed, so nothing fetches it again unasked', async () => {
    const { service, items } = aService();
    const { request } = await service.add({ ...DUNE, isApproved: true });
    const [item] = await items.list();

    await items.update(item?.id ?? '', { state: 'filed' });
    await service.arrived(request.id, 'media-1');

    const left = await service.left(request.id, null);

    expect(left).toMatchObject({ state: 'failed', mediaId: null });
    expect(left?.items[0]?.problem?.code).toBe('common.noLongerInTheLibrary');
    expect((await service.retry(request.id))?.items[0]).toMatchObject({ state: 'wanted' });
    expect(await service.left('missing', null)).toBeNull();
  });

  it('marks what the library holds arrived, however it got there, and only once', async () => {
    const { service, items } = aService();
    const { request } = await service.add({ ...SEVERANCE, seasons: [1, 2] });
    const [first, second] = (await items.list()).toSorted(
      (left, right) => (left.season ?? 0) - (right.season ?? 0),
    );

    await items.update(second?.id ?? '', { state: 'downloading' });

    const arrived = await service.arrivedInLibrary(request.id, {
      mediaId: 'severance',
      episodes: [
        { season: 1, episode: 1 },
        { season: 2, episode: 1 },
      ],
    });

    expect(arrived?.newlyAvailable).toBe(1);
    expect(arrived?.request.mediaId).toBe('severance');
    expect(await items.find(first?.id ?? '')).toMatchObject({ state: 'available' });
    expect(await items.find(second?.id ?? '')).toMatchObject({ state: 'downloading' });
    expect(
      await service.arrivedInLibrary(request.id, {
        mediaId: 'severance',
        episodes: [{ season: 1, episode: 1 }],
      }),
    ).toMatchObject({ newlyAvailable: 0 });
    expect(await service.arrivedInLibrary('missing', { mediaId: 'x' })).toBeNull();
  });

  it('marks even what is downloading arrived for a request handed to a connected app', async () => {
    const { service, items } = aService();
    const handOff = {
      appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
      rootFolderPath: '/movies',
      qualityProfileId: 4,
    };
    const { request } = await service.add({ ...DUNE, isApproved: true, handOff });
    const [item] = await items.list();

    await items.update(item?.id ?? '', { state: 'downloading' });

    expect(await service.arrivedInLibrary(request.id, { mediaId: 'dune' })).toMatchObject({
      newlyAvailable: 1,
      request: { state: 'available' },
    });
  });

  it('marks albums arrived by their release groups', async () => {
    const { service } = aService();
    const { request } = await service.add(PINK_FLOYD);

    expect(
      await service.arrivedInLibrary(request.id, {
        mediaId: 'the-wall',
        albums: ['a4c2e8f0-9d1b-3c5e-8f7a-2b4d6e8f0a1c'],
      }),
    ).toMatchObject({ newlyAvailable: 1 });
    expect(await service.arrivedInLibrary(request.id, { mediaId: 'the-wall' })).toMatchObject({
      newlyAvailable: 0,
      request: { mediaId: 'the-wall' },
    });
  });

  it('removes a request and what it waited for', async () => {
    const { service, items } = aService();
    const { request } = await service.add(SEVERANCE);

    expect(await service.remove(request.id)).toBe(true);
    expect(await items.list()).toEqual([]);
    expect(await service.find(request.id)).toBeNull();
  });
});
