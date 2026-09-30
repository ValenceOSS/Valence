import { library, mediaItem, user, viewerProfile } from '#dialect/Schema';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * A migrated database holding one account with two profiles, Pat and Sam, a film library with one
 * film in it and an empty music library, so a store can be tried against the rows it refers to.
 *
 * @returns The database, and Pat watching as an administrator.
 */
const aHousehold = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'account', name: 'Pat', email: 'pat@example.test' });
  await db.insert(viewerProfile).values([
    { id: 'pat', userId: 'account', name: 'Pat', colour: 'pink' },
    { id: 'sam', userId: 'account', name: 'Sam', colour: 'blue' },
  ]);
  await db.insert(library).values([
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
    { id: 'music', name: 'Music', kind: 'music', path: '/music' },
  ]);
  await db.insert(mediaItem).values({
    id: 'film',
    libraryId: 'films',
    path: '/films/film.mkv',
    title: 'A Film',
    sizeBytes: 1000,
    modifiedAtMs: 0,
    container: 'mkv',
    durationSeconds: 5400,
    videoCodec: 'h264',
    videoRange: 'sdr',
    width: 1920,
    height: 1080,
    audioStreams: [],
    subtitleStreams: [],
  });

  const viewer = {
    kind: 'account',
    accountId: 'account',
    profileId: 'pat',
    isAdministrator: true,
  } satisfies Viewer;

  return { db, viewer };
};

export { aHousehold };
