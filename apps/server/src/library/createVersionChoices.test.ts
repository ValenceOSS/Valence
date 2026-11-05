import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createVersionChoices } from './createVersionChoices';

const STARTING_THE_DATABASE_MS = 60_000;

/**
 * A film held twice, the first standing for it, with a trailer hanging from it.
 *
 * @returns The database, and a way to read a file's link and name back.
 */
const aFilmTwice = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
  await db.insert(mediaItem).values([
    { ...aMediaItemRow('first', 'films'), path: '/films/a/first.mkv', externalId: '1' },
    {
      ...aMediaItemRow('second', 'films'),
      path: '/films/a/second.mkv',
      externalId: '1',
      parentId: 'first',
      versionLabel: 'Second',
    },
    {
      ...aMediaItemRow('trailer', 'films'),
      path: '/films/a/trailer.mkv',
      parentId: 'first',
      extraKind: 'trailer',
    },
  ]);

  const read = async (id: string) => {
    const [row] = await db
      .select({ parentId: mediaItem.parentId, versionLabel: mediaItem.versionLabel })
      .from(mediaItem)
      .where(eq(mediaItem.id, id));

    return row;
  };

  return { db, read, choices: createVersionChoices(db) };
};

describe('createVersionChoices', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('makes a version stand for its film, taking the others and the extras with it', async () => {
    const { read, choices } = await aFilmTwice();

    await expect(choices.choose('second', { isStanding: true })).resolves.toBe(true);

    expect(await read('second')).toMatchObject({ parentId: null });
    expect(await read('first')).toMatchObject({ parentId: 'second' });
    expect(await read('trailer')).toMatchObject({ parentId: 'second' });
  });

  it('names a version, and keeps both choices through a scan that links and names it again', async () => {
    const { db, read, choices } = await aFilmTwice();

    await choices.choose('second', { label: 'Director’s Cut', isStanding: true });
    await db.update(mediaItem).set({ parentId: null }).where(eq(mediaItem.id, 'first'));
    await db
      .update(mediaItem)
      .set({ parentId: 'first', versionLabel: 'Second' })
      .where(eq(mediaItem.id, 'second'));
    await db.update(mediaItem).set({ parentId: 'first' }).where(eq(mediaItem.id, 'trailer'));
    await choices.apply('films');

    expect(await read('second')).toEqual({ parentId: null, versionLabel: 'Director’s Cut' });
    expect(await read('first')).toMatchObject({ parentId: 'second' });
  });

  it('goes back to what the file name says, and turns an extra away', async () => {
    const { read, choices } = await aFilmTwice();

    await choices.choose('second', { label: 'Mine' });
    await choices.choose('second', { label: null });

    expect(await read('second')).toMatchObject({ versionLabel: null });
    await expect(choices.choose('trailer', { label: 'x' })).resolves.toBe(false);
  });
});
