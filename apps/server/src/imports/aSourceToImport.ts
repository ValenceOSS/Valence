/* oxlint-disable valence/no-hard-coded-strings -- test fixtures: the titles and names stand in for what a real server holds, and are never shown */
import { NO_IDS } from './NO_IDS';
import type { SourceItem, SourceReader, SourceUser } from './SourceReader';

const TINY_PICTURE = new Uint8Array([137, 80, 78, 71]);

/**
 * A person on the recorded source, with whatever a test changes.
 *
 * @param changes - What differs from an ordinary readable person who may see everything.
 * @returns The person.
 */
const aSourceUser = (
  changes: Partial<SourceUser> & Pick<SourceUser, 'id' | 'name'>,
): SourceUser => ({
  username: changes.name,
  email: null,
  isAdministrator: false,
  isDisabled: false,
  access: 'readable',
  libraryAccess: { kind: 'all' },
  ceiling: null,
  avatarUrl: null,
  ...changes,
});

/**
 * An item on the recorded source, with whatever a test changes.
 *
 * @param changes - What differs from an item with nothing known about it.
 * @returns The item.
 */
const aSourceItem = (
  changes: Partial<SourceItem> & Pick<SourceItem, 'id' | 'kind' | 'title'>,
): SourceItem => ({
  libraryId: null,
  year: null,
  path: null,
  ids: NO_IDS,
  seriesId: null,
  seasonNumber: null,
  episodeNumber: null,
  albumId: null,
  discNumber: null,
  trackNumber: null,
  durationSeconds: null,
  addedAt: null,
  ...changes,
});

const USERS: SourceUser[] = [
  aSourceUser({ id: 'u-pat', name: 'Pat', isAdministrator: true, avatarUrl: '/face/pat' }),
  aSourceUser({
    id: 'u-sam',
    name: 'Sam',
    libraryAccess: { kind: 'only', libraryIds: ['lib-films'] },
    ceiling: { maximumAge: 13, allowsUnrated: false },
  }),
  aSourceUser({ id: 'u-old', name: 'Old Lodger', email: 'old@example.test', isDisabled: true }),
  aSourceUser({ id: 'u-ash', name: 'Ash', access: 'needsPin' }),
];

const ITEMS: SourceItem[] = [
  aSourceItem({
    id: 'heat',
    kind: 'movie',
    title: 'Heat',
    year: 1995,
    libraryId: 'lib-films',
    path: '/data/movies/Heat (1995)/Heat.mkv',
    ids: { ...NO_IDS, tmdb: '949' },
    durationSeconds: 10200,
    addedAt: new Date('2024-01-02T00:00:00Z'),
  }),
  aSourceItem({
    id: 'home',
    kind: 'movie',
    title: 'A Home Movie',
    year: 2019,
    libraryId: 'lib-films',
    path: '/data/movies/home.mkv',
  }),
  aSourceItem({
    id: 'wire',
    kind: 'series',
    title: 'The Wire',
    libraryId: 'lib-shows',
    ids: { ...NO_IDS, tvdb: '79126' },
  }),
  aSourceItem({
    id: 'wire-101',
    kind: 'episode',
    title: 'The Target',
    libraryId: 'lib-shows',
    seriesId: 'wire',
    seasonNumber: 1,
    episodeNumber: 1,
  }),
  aSourceItem({
    id: 'wire-102',
    kind: 'episode',
    title: 'The Detail',
    libraryId: 'lib-shows',
    seriesId: 'wire-elsewhere',
    seasonNumber: 1,
    episodeNumber: 2,
    path: '/data/tv/The Wire/Season 01/S01E02.mkv',
  }),
  aSourceItem({
    id: 'album',
    kind: 'album',
    title: 'Blue Lines',
    libraryId: 'lib-music',
    ids: { ...NO_IDS, musicBrainzAlbum: '2c0a3d1e-aaaa-4bbb-8ccc-000000000001' },
  }),
  aSourceItem({
    id: 'track',
    kind: 'track',
    title: 'Unfinished Sympathy',
    libraryId: 'lib-music',
    albumId: 'album',
    discNumber: 1,
    trackNumber: 3,
  }),
];

/**
 * A Jellyfin-like server read through the reader interface rather than over the network: four
 * people, films, an episode or two, a song, a box set, a playlist and an intro marker, with
 * whatever a test changes.
 *
 * @param changes - The parts of the reader a test replaces.
 * @returns The reader.
 */
const aSourceToImport = (changes: Partial<SourceReader> = {}): SourceReader => ({
  identify: () =>
    Promise.resolve({ kind: 'jellyfin', serverId: 'den', name: 'Den', version: '12.1.0' }),
  users: () => Promise.resolve(USERS),
  libraries: () =>
    Promise.resolve([
      { id: 'lib-films', name: 'Films', kind: 'movies', locations: ['/data/movies'] },
      { id: 'lib-shows', name: 'Shows', kind: 'shows', locations: ['/data/tv'] },
      { id: 'lib-music', name: 'Music', kind: 'music', locations: ['/data/music'] },
      { id: 'lib-photos', name: 'Photos', kind: null, locations: ['/data/photos'] },
    ]),
  items: (library) => Promise.resolve(ITEMS.filter((item) => item.libraryId === library.id)),
  userStates: (user) =>
    Promise.resolve(
      user.id === 'u-pat'
        ? [
            {
              itemId: 'heat',
              isPlayed: true,
              playCount: 3,
              lastPlayedAt: new Date('2026-03-04T21:00:00Z'),
              positionSeconds: 0,
              isFavourite: true,
              rating: 9,
            },
            {
              itemId: 'wire-101',
              isPlayed: true,
              playCount: 1,
              lastPlayedAt: new Date('2026-04-01T20:00:00Z'),
              positionSeconds: 0,
              isFavourite: false,
              rating: null,
            },
            {
              itemId: 'wire-102',
              isPlayed: false,
              playCount: 0,
              lastPlayedAt: new Date('2026-04-02T20:30:00Z'),
              positionSeconds: 1200,
              isFavourite: false,
              rating: null,
            },
            {
              itemId: 'wire',
              isPlayed: false,
              playCount: 0,
              lastPlayedAt: null,
              positionSeconds: 0,
              isFavourite: true,
              rating: 10,
            },
            {
              itemId: 'home',
              isPlayed: true,
              playCount: 1,
              lastPlayedAt: null,
              positionSeconds: 0,
              isFavourite: false,
              rating: null,
            },
          ]
        : user.id === 'u-sam'
          ? [
              {
                itemId: 'heat',
                isPlayed: false,
                playCount: 0,
                lastPlayedAt: new Date('2026-05-01T18:00:00Z'),
                positionSeconds: 600,
                isFavourite: false,
                rating: null,
              },
            ]
          : [],
    ),
  plays: () => Promise.resolve([]),
  favouriteArtists: (user) =>
    Promise.resolve(
      user.id === 'u-pat'
        ? [
            { name: 'Massive Attack', musicBrainzId: '10adbe5e-a2c0-4bf3-8249-2b4cbf6e6ca8' },
            { name: 'Nobody Valence Knows', musicBrainzId: null },
          ]
        : [],
    ),
  collections: () =>
    Promise.resolve([
      {
        id: 'box-1',
        name: 'Heat Collection',
        description: 'Heists.',
        itemIds: ['heat', 'wire', 'home', 'heat'],
      },
    ]),
  playlists: (users) =>
    Promise.resolve(
      new Map(
        users.some((user) => user.id === 'u-pat')
          ? [
              [
                'u-pat',
                [
                  {
                    id: 'pl-1',
                    name: 'Sunday',
                    isShared: true,
                    itemIds: ['wire-101', 'heat', 'home'],
                  },
                ],
              ],
            ]
          : [],
      ),
    ),
  markers: (item) =>
    Promise.resolve(
      item.id === 'wire-101' ? [{ kind: 'intro', startSeconds: 30, endSeconds: 90 }] : [],
    ),
  avatar: (user) =>
    Promise.resolve(
      user.avatarUrl === null ? null : { body: TINY_PICTURE, contentType: 'image/png' },
    ),
  ...changes,
});

export { aSourceItem, aSourceToImport, aSourceUser };
