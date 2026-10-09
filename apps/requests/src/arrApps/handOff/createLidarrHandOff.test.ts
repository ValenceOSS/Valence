import { describe, expect, it } from 'vitest';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { createLidarrHandOff } from './createLidarrHandOff';

const HAND_OFF = {
  appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  rootFolderPath: '/music',
  qualityProfileId: 2,
  metadataProfileId: 1,
  searchesOnAdd: true,
};

const RADIOHEAD = 'a74b1b7f-71a5-4011-9441-d0b5e4122711';

const OK_COMPUTER = 'b1392450-e666-3926-a536-22c65f834433';

const KID_A = 'c1392450-e666-3926-a536-22c65f834434';

const LIDARR = anArrApp({ kind: 'lidarr', name: 'Lidarr' });

const ALBUM_REQUEST = aMediaRequest({
  kind: 'album',
  tmdbId: null,
  musicBrainzId: OK_COMPUTER,
  title: 'OK Computer',
  artistName: 'Radiohead',
});

const ARTIST_REQUEST = aMediaRequest({
  kind: 'artist',
  tmdbId: null,
  musicBrainzId: RADIOHEAD,
  title: 'Radiohead',
});

const ARTIST = { artistName: 'Radiohead', foreignArtistId: RADIOHEAD, monitored: true, id: 2 };

/**
 * An album as Lidarr lists it, with how many of its tracks are there.
 *
 * @param fields - What to change.
 * @returns The album.
 */
const anAlbum = (fields: Record<string, number | boolean | string | null | object>) => ({
  title: 'OK Computer',
  foreignAlbumId: OK_COMPUTER,
  artistId: 2,
  monitored: true,
  statistics: { trackFileCount: 0, trackCount: 12, totalTrackCount: 12 },
  id: 9,
  ...fields,
});

describe('createLidarrHandOff', () => {
  it('adds an album Lidarr lacks, its artist unmonitored beside it', async () => {
    const arr = aFakeArr({
      'GET /api/v1/album': { body: [] },
      'GET /api/v1/album/lookup': { body: [anAlbum({ id: 0, artistId: 0, artist: ARTIST })] },
      'GET /api/v1/artist': { body: [] },
      'POST /api/v1/album': { status: 201, body: anAlbum({}) },
    });

    expect(
      await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(
        ALBUM_REQUEST,
        [],
        HAND_OFF,
      ),
    ).toBe(2);
    expect(arr.asked[1]?.query.get('term')).toBe(`lidarr:${OK_COMPUTER}`);
    expect(arr.sent('POST', '/api/v1/album')).toEqual([
      {
        foreignAlbumId: OK_COMPUTER,
        title: 'OK Computer',
        monitored: true,
        anyReleaseOk: true,
        artist: {
          foreignArtistId: RADIOHEAD,
          artistName: 'Radiohead',
          qualityProfileId: 2,
          metadataProfileId: 1,
          rootFolderPath: '/music',
          monitored: true,
          monitorNewItems: 'none',
          addOptions: { monitor: 'none', searchForMissingAlbums: false },
        },
        addOptions: { searchForNewAlbum: true },
      },
    ]);
  });

  it('adds an album beside an artist Lidarr already has', async () => {
    const arr = aFakeArr({
      'GET /api/v1/album': { body: [] },
      'GET /api/v1/album/lookup': { body: [anAlbum({ id: 0, artist: ARTIST })] },
      'GET /api/v1/artist': { body: [{ ...ARTIST, monitored: false }] },
      'POST /api/v1/album': { status: 201, body: anAlbum({}) },
    });

    await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(
      ALBUM_REQUEST,
      [],
      HAND_OFF,
    );

    expect(arr.sent('POST', '/api/v1/album')[0]).toMatchObject({
      artist: { id: 2, monitored: false },
    });
  });

  it('monitors and searches for an album Lidarr has but is not watching', async () => {
    const arr = aFakeArr({
      'GET /api/v1/album': { body: [anAlbum({ monitored: false })] },
      'PUT /api/v1/album/monitor': { status: 202, body: null },
      'POST /api/v1/command': { status: 201, body: { name: 'AlbumSearch', id: 1 } },
    });

    expect(
      await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(
        ALBUM_REQUEST,
        [],
        HAND_OFF,
      ),
    ).toBe(2);
    expect(arr.sent('PUT', '/api/v1/album/monitor')).toEqual([{ albumIds: [9], monitored: true }]);
    expect(arr.sent('POST', '/api/v1/command')).toEqual([{ name: 'AlbumSearch', albumIds: [9] }]);
  });

  it('leaves an album Lidarr already watches as it is', async () => {
    const arr = aFakeArr({ 'GET /api/v1/album': { body: [anAlbum({})] } });

    await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(
      ALBUM_REQUEST,
      [],
      HAND_OFF,
    );

    expect(arr.asked).toHaveLength(1);
  });

  it('adds an artist Lidarr lacks, with every album its metadata profile takes', async () => {
    const arr = aFakeArr({
      'GET /api/v1/artist': { body: [] },
      'GET /api/v1/artist/lookup': { body: [{ ...ARTIST, id: 0 }] },
      'POST /api/v1/artist': { status: 201, body: ARTIST },
    });

    expect(
      await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(
        ARTIST_REQUEST,
        [],
        HAND_OFF,
      ),
    ).toBe(2);
    expect(arr.sent('POST', '/api/v1/artist')).toEqual([
      {
        foreignArtistId: RADIOHEAD,
        artistName: 'Radiohead',
        qualityProfileId: 2,
        metadataProfileId: 1,
        rootFolderPath: '/music',
        monitored: true,
        monitorNewItems: 'all',
        addOptions: { monitor: 'all', searchForMissingAlbums: true },
      },
    ]);
  });

  it('monitors and searches for an artist Lidarr has but is not watching', async () => {
    const arr = aFakeArr({
      'GET /api/v1/artist': { body: [{ ...ARTIST, monitored: false }] },
      'PUT /api/v1/artist/editor': { status: 202, body: null },
      'POST /api/v1/command': { status: 201, body: { name: 'ArtistSearch', id: 1 } },
    });

    await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(
      ARTIST_REQUEST,
      [],
      HAND_OFF,
    );

    expect(arr.sent('PUT', '/api/v1/artist/editor')).toEqual([{ artistIds: [2], monitored: true }]);
    expect(arr.sent('POST', '/api/v1/command')).toEqual([{ name: 'ArtistSearch', artistId: 2 }]);
  });

  it('neither searches nor monitors again an artist it watches, where the library says not to', async () => {
    const arr = aFakeArr({ 'GET /api/v1/artist': { body: [ARTIST] } });

    await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(ARTIST_REQUEST, [], {
      ...HAND_OFF,
      searchesOnAdd: false,
    });

    expect(arr.asked).toHaveLength(1);
  });

  it('refuses what it cannot hand over', async () => {
    const arr = aFakeArr({
      'GET /api/v1/album': { body: [] },
      'GET /api/v1/album/lookup': { body: [anAlbum({ artist: null })] },
      'GET /api/v1/artist': { body: [] },
      'GET /api/v1/artist/lookup': { body: [] },
    });
    const handOff = createLidarrHandOff(createArrCaller(arr.fetch, LIDARR));

    await expect(
      handOff.place({ ...ALBUM_REQUEST, musicBrainzId: null }, [], HAND_OFF),
    ).rejects.toThrow('It has no MusicBrainz ID to send to Lidarr.');
    await expect(handOff.place(ALBUM_REQUEST, [], HAND_OFF)).rejects.toThrow(
      'Lidarr can’t find it by its MusicBrainz ID.',
    );
    await expect(handOff.place(ARTIST_REQUEST, [], HAND_OFF)).rejects.toThrow(
      'Lidarr can’t find it by its MusicBrainz ID.',
    );
  });

  it('will not add an artist without a metadata profile', async () => {
    const arr = aFakeArr({
      'GET /api/v1/artist': { body: [] },
      'GET /api/v1/artist/lookup': { body: [ARTIST] },
    });

    await expect(
      createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).place(ARTIST_REQUEST, [], {
        ...HAND_OFF,
        metadataProfileId: null,
      }),
    ).rejects.toThrow('Lidarr needs a metadata profile.');
  });

  it('sees each album imported whole, queued or still missing, and monitors any asked for since', async () => {
    const items = [
      aRequestItem({ id: 'whole', musicBrainzId: OK_COMPUTER }),
      aRequestItem({ id: 'queued', musicBrainzId: KID_A }),
      aRequestItem({ id: 'settled', musicBrainzId: OK_COMPUTER, state: 'available' }),
      aRequestItem({ id: 'unknown', musicBrainzId: 'd1392450-e666-3926-a536-22c65f834435' }),
    ];
    const arr = aFakeArr({
      'GET /api/v1/album': {
        body: [
          anAlbum({ statistics: { trackFileCount: 12, trackCount: 12, totalTrackCount: 12 } }),
          anAlbum({ id: 10, title: 'Kid A', foreignAlbumId: KID_A, monitored: false }),
        ],
      },
      'GET /api/v1/trackfile': {
        body: [
          { id: 501, albumId: 9, path: '/music/Radiohead/OK Computer (1997)/01 - Airbag.flac' },
        ],
      },
      'PUT /api/v1/album/monitor': { status: 202, body: null },
      'POST /api/v1/command': { status: 201, body: { name: 'AlbumSearch', id: 1 } },
    });
    const queue = ArrQueuePageSchema.parse({
      records: [
        { id: 5, artistId: 2, albumId: 10, title: 'Radiohead - Kid A', status: 'downloading' },
      ],
    }).records;

    expect(
      await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).watch(
        ARTIST_REQUEST,
        items,
        HAND_OFF,
        2,
        queue,
      ),
    ).toEqual([
      {
        itemId: 'whole',
        kind: 'imported',
        path: '/music/Radiohead/OK Computer (1997)/01 - Airbag.flac',
        folder: '/music/Radiohead/OK Computer (1997)',
      },
      { itemId: 'queued', kind: 'queued', record: queue[0] },
      { itemId: 'settled', kind: 'unchanged' },
      { itemId: 'unknown', kind: 'missing' },
    ]);
    expect(arr.sent('PUT', '/api/v1/album/monitor')).toEqual([{ albumIds: [10], monitored: true }]);
  });

  it('counts an album with no tracks known, or no files listed, as missing', async () => {
    const arr = aFakeArr({
      'GET /api/v1/album': {
        body: [
          anAlbum({ statistics: null }),
          anAlbum({
            id: 10,
            foreignAlbumId: KID_A,
            statistics: { trackFileCount: 10, trackCount: 10, totalTrackCount: 10 },
          }),
        ],
      },
      'GET /api/v1/trackfile': { body: [] },
    });

    expect(
      await createLidarrHandOff(createArrCaller(arr.fetch, LIDARR)).watch(
        ARTIST_REQUEST,
        [
          aRequestItem({ id: 'a', musicBrainzId: OK_COMPUTER }),
          aRequestItem({ id: 'b', musicBrainzId: KID_A }),
        ],
        HAND_OFF,
        2,
        [],
      ),
    ).toEqual([
      { itemId: 'a', kind: 'missing' },
      { itemId: 'b', kind: 'missing' },
    ]);
  });

  it('asks Lidarr to search the artist again, and says where an album’s page is', async () => {
    const arr = aFakeArr({
      'POST /api/v1/command': { status: 201, body: { name: 'ArtistSearch', id: 1 } },
    });
    const handOff = createLidarrHandOff(createArrCaller(arr.fetch, LIDARR));

    await handOff.search(ALBUM_REQUEST, 3);

    expect(arr.sent('POST', '/api/v1/command')).toEqual([{ name: 'ArtistSearch', artistId: 3 }]);
    expect(await handOff.pageOf(ALBUM_REQUEST, 3)).toBe(
      `/album/${ALBUM_REQUEST.musicBrainzId ?? ''}`,
    );
  });
});
