/* eslint-disable valence/no-hard-coded-strings -- stands in for a household's libraries and profiles in tests */
import { asc } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  ageCeiling,
  ageException,
  hidden,
  library,
  libraryBlock,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  series,
  user,
  viewerProfile,
} from '#dialect/Schema';
import type { SQL } from 'drizzle-orm';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * A database of films, a programme, a children's library, a song and a library one account is kept
 * out of, with the ceilings, exceptions and hidden things that tell the visibility conditions apart:
 * a child who may not see much, a teenager allowed unrated things, and an administrator. Each
 * condition is built as the server builds it and run here, so a test reads which rows it kept.
 *
 * @returns Who can be asked about, and what to read items and libraries through.
 */
const aVisibilityPlayground = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values([
    { id: 'kid', name: 'Kid', email: 'kid@example.com' },
    { id: 'teen', name: 'Teen', email: 'teen@example.com' },
    { id: 'admin', name: 'Admin', email: 'admin@example.com' },
  ]);
  await db
    .insert(viewerProfile)
    .values({ id: 'kid-face', userId: 'kid', name: 'Kid', colour: 'red' });
  await db.insert(library).values([
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
    { id: 'kids', name: 'Kids', kind: 'movies', path: '/kids' },
    { id: 'music', name: 'Music', kind: 'music', path: '/music' },
    { id: 'locked', name: 'Locked', kind: 'movies', path: '/locked' },
  ]);
  await db.insert(series).values({ id: 'show', libraryId: 'films', key: 'show', title: 'Show' });
  await db.insert(mediaItem).values([
    {
      ...aMediaItemRow('film-12', 'films'),
      path: '/film-12',
      seriesId: null,
      certificationAge: 12,
    },
    {
      ...aMediaItemRow('film-18', 'films'),
      path: '/film-18',
      seriesId: null,
      certificationAge: 18,
    },
    {
      ...aMediaItemRow('film-unrated', 'films'),
      path: '/film-unrated',
      seriesId: null,
      certificationAge: null,
    },
    {
      ...aMediaItemRow('episode-15', 'films'),
      path: '/episode-15',
      seriesId: 'show',
      certificationAge: 15,
    },
    {
      ...aMediaItemRow('cartoon', 'kids'),
      path: '/cartoon',
      seriesId: null,
      certificationAge: null,
    },
    { ...aMediaItemRow('song', 'music'), path: '/song', seriesId: null, certificationAge: null },
    {
      ...aMediaItemRow('locked-film', 'locked'),
      path: '/locked-film',
      seriesId: null,
      certificationAge: 0,
    },
  ]);
  await db.insert(musicArtist).values({
    id: 'artist',
    libraryId: 'music',
    name: 'Artist',
    nameKey: 'artist',
    sortName: 'Artist',
  });
  await db.insert(musicAlbum).values({
    id: 'album',
    libraryId: 'music',
    artistId: 'artist',
    title: 'Album',
    titleKey: 'album',
  });
  await db.insert(musicTrack).values({ mediaItemId: 'song', albumId: 'album', codec: 'flac' });
  await db.insert(libraryBlock).values({ userId: 'kid', libraryId: 'locked' });
  await db.insert(ageCeiling).values([
    { userId: 'kid', libraryId: 'films', maximumAge: 12, allowsUnrated: false },
    { userId: 'kid', libraryId: 'music', maximumAge: 12, allowsUnrated: false },
    { userId: 'teen', libraryId: 'films', maximumAge: 15, allowsUnrated: true },
  ]);
  await db.insert(ageException).values([
    { id: 'allow-show', userId: 'kid', mediaItemId: null, seriesId: 'show', effect: 'allow' },
    { id: 'deny-film', userId: 'kid', mediaItemId: 'film-12', seriesId: null, effect: 'deny' },
  ]);
  await db.insert(hidden).values([
    { id: 'hide-film', profileId: 'kid-face', mediaItemId: 'film-unrated' },
    { id: 'hide-show', profileId: 'kid-face', seriesId: 'show' },
    { id: 'hide-music', profileId: 'kid-face', libraryId: 'music' },
  ]);

  const viewers = {
    kid: { kind: 'account', accountId: 'kid', profileId: 'kid-face', isAdministrator: false },
    kidWithoutProfiles: {
      kind: 'account',
      accountId: 'kid',
      profileId: null,
      isAdministrator: false,
    },
    teen: { kind: 'account', accountId: 'teen', profileId: null, isAdministrator: false },
    admin: { kind: 'account', accountId: 'admin', profileId: null, isAdministrator: true },
    adminWatchingAsKid: {
      kind: 'account',
      accountId: 'kid',
      profileId: 'kid-face',
      isAdministrator: true,
    },
    guest: { kind: 'guest', shareId: 'share' },
    server: { kind: 'server' },
  } satisfies Record<string, Viewer>;

  return {
    viewers,
    itemsKeptBy: async (build: (db: AnyValenceDatabase) => SQL | undefined) =>
      (
        await db
          .select({ id: mediaItem.id })
          .from(mediaItem)
          .where(build(db))
          .orderBy(asc(mediaItem.id))
      ).map((row) => row.id),
    librariesKeptBy: async (build: (db: AnyValenceDatabase) => SQL | undefined) =>
      (
        await db.select({ id: library.id }).from(library).where(build(db)).orderBy(asc(library.id))
      ).map((row) => row.id),
  };
};

export { aVisibilityPlayground };
