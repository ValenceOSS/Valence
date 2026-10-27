import { describe, expect, it } from 'vitest';
import { profileAgeCeiling, profileLibraryBlock, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { aVisibilityPlayground } from '@ValenceServer/visibility/aVisibilityPlayground';
import { mayWatchStreamedFilm } from './mayWatchStreamedFilm';

/**
 * The visibility playground, with the database it keeps its household in.
 *
 * @returns The database and the playground's viewers.
 */
const aHousehold = async () => {
  const playground = await aVisibilityPlayground();
  const reached: AnyValenceDatabase[] = [];

  await playground.librariesKeptBy((db) => {
    reached.push(db);

    return undefined;
  });

  const [db] = reached;

  if (db === undefined) {
    throw new Error('The playground kept no database.');
  }

  return { db, viewers: playground.viewers };
};

describe('mayWatchStreamedFilm', () => {
  it('refuses somebody limited to any library at all, whatever the film', async () => {
    const { db, viewers } = await aHousehold();

    expect(await mayWatchStreamedFilm(db, viewers.kidWithoutProfiles, 0)).toBe(false);
  });

  it('holds a film to every age ceiling the account has, in any library', async () => {
    const { db, viewers } = await aHousehold();

    expect(await mayWatchStreamedFilm(db, viewers.teen, 12)).toBe(true);
    expect(await mayWatchStreamedFilm(db, viewers.teen, 18)).toBe(false);
    expect(await mayWatchStreamedFilm(db, viewers.teen, null)).toBe(true);
  });

  it('holds a film to the profile’s own limits and ceilings too', async () => {
    const { db, viewers } = await aHousehold();

    await db
      .insert(viewerProfile)
      .values({ id: 'teen-face', userId: 'teen', name: 'Teen', colour: 'red' });
    await db
      .insert(profileAgeCeiling)
      .values({ profileId: 'teen-face', libraryId: 'kids', maximumAge: 7, allowsUnrated: false });

    const asAProfile = { ...viewers.teen, profileId: 'teen-face' };

    expect(await mayWatchStreamedFilm(db, asAProfile, 7)).toBe(true);
    expect(await mayWatchStreamedFilm(db, asAProfile, 12)).toBe(false);
    expect(await mayWatchStreamedFilm(db, asAProfile, null)).toBe(false);

    await db.insert(profileLibraryBlock).values({ profileId: 'teen-face', libraryId: 'films' });

    expect(await mayWatchStreamedFilm(db, asAProfile, 0)).toBe(false);
  });

  it('lets an administrator past the account’s limits, and nobody without an account at all', async () => {
    const { db, viewers } = await aHousehold();

    expect(
      await mayWatchStreamedFilm(db, { ...viewers.kidWithoutProfiles, isAdministrator: true }, 18),
    ).toBe(true);
    expect(await mayWatchStreamedFilm(db, viewers.guest, 0)).toBe(false);
    expect(await mayWatchStreamedFilm(db, viewers.server, 0)).toBe(false);
  });
});
