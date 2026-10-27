import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  ageCeiling,
  hidden,
  library,
  libraryBlock,
  mediaItem,
  series,
  user,
  viewerProfile,
  watchProgress,
} from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createDatabaseCollectionService } from './createDatabaseCollectionService';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { TitleRules } from '@ValenceContracts/schemas/SmartRules';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const STARTING_POSTGRES_MS = 60_000;

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const SHOWS = '00000000-0000-4000-8000-0000000000f2';

const LOCKED = '00000000-0000-4000-8000-0000000000f3';

const FIRST = '00000000-0000-4000-8000-000000000001';

const SECOND = '00000000-0000-4000-8000-000000000002';

const GROWN_UP = '00000000-0000-4000-8000-000000000003';

const BEHIND_A_LOCK = '00000000-0000-4000-8000-000000000004';

const PILOT = '00000000-0000-4000-8000-000000000005';

const FINALE = '00000000-0000-4000-8000-000000000006';

const SHOW = '00000000-0000-4000-8000-00000000000a';

const NOWHERE = '00000000-0000-4000-8000-00000000000b';

const FILMS_BY_TITLE: TitleRules = { holds: 'films', rules: [], order: 'title', limit: null };

const FINISHED: TitleRules = { ...FILMS_BY_TITLE, rules: [{ kind: 'watched', state: 'finished' }] };

const ADMIN: Viewer = {
  kind: 'account',
  accountId: 'admin',
  profileId: null,
  isAdministrator: true,
};

const KID: Viewer = {
  kind: 'account',
  accountId: 'kid',
  profileId: 'kid-face',
  isAdministrator: false,
};

/**
 * A card for a title, as the library would read one out, with only what a test looks at.
 *
 * @param id - The title.
 * @param libraryId - Where it is.
 * @returns The card.
 */
const aCard = (id: string, libraryId: string): MediaSummary => ({
  id,
  libraryId,
  title: id,
  year: null,
  durationSeconds: 60,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-10-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
});

/**
 * A server with two films, one for grown-ups only, a film in a library the kid is kept out of, and
 * a programme of two episodes, and a collection service reading it.
 *
 * @returns The service, the database, and what was told of changes.
 */
const aServer = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values([
    { id: 'admin', name: 'Admin', email: 'admin@example.com' },
    { id: 'kid', name: 'Kid', email: 'kid@example.com' },
  ]);
  await db
    .insert(viewerProfile)
    .values({ id: 'kid-face', userId: 'kid', name: 'Kid', colour: 'red' });
  await db.insert(library).values([
    { id: FILMS, name: 'Films', kind: 'movies', path: '/films' },
    { id: SHOWS, name: 'Shows', kind: 'shows', path: '/shows' },
    { id: LOCKED, name: 'Locked', kind: 'movies', path: '/locked' },
  ]);
  await db.insert(series).values({ id: SHOW, libraryId: SHOWS, key: 'show', title: 'Show' });
  await db.insert(mediaItem).values([
    { ...aMediaItemRow(FIRST, FILMS), certificationAge: 0, posterUrl: 'https://art/first' },
    { ...aMediaItemRow(SECOND, FILMS), certificationAge: 0 },
    { ...aMediaItemRow(GROWN_UP, FILMS), certificationAge: 18 },
    { ...aMediaItemRow(BEHIND_A_LOCK, LOCKED), certificationAge: 0 },
    {
      ...aMediaItemRow(PILOT, SHOWS),
      seriesId: SHOW,
      seriesTitle: 'Show',
      certificationAge: 0,
      posterUrl: 'https://art/show',
    },
    { ...aMediaItemRow(FINALE, SHOWS), seriesId: SHOW, seriesTitle: 'Show', certificationAge: 18 },
  ]);
  await db.insert(libraryBlock).values({ userId: 'kid', libraryId: LOCKED });
  await db.insert(ageCeiling).values([
    { userId: 'kid', libraryId: FILMS, maximumAge: 12, allowsUnrated: false },
    { userId: 'kid', libraryId: SHOWS, maximumAge: 12, allowsUnrated: false },
  ]);

  const onChanged = vi.fn();
  const listItems = vi.fn<LibraryService['listItems']>((_viewer, libraryId, options) =>
    Promise.resolve({
      items: (options.ids ?? []).map((id) => aCard(id, libraryId)),
      total: options.ids?.length ?? 0,
    }),
  );
  const collections = createDatabaseCollectionService({
    db,
    library: { listItems },
    artworkDirectory: await mkdtemp(join(tmpdir(), 'collections-')),
    onChanged,
  });

  return { db, collections, onChanged, listItems };
};

describe('createDatabaseCollectionService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('fills a collection in the order given, once each, with an episode standing for its programme', async () => {
    const { collections } = await aServer();
    const made = await collections.create({ name: 'Saga', createdBy: 'admin', isOrdered: true });

    await collections.replaceEntries(made.id, [
      { mediaItemId: SECOND },
      { mediaItemId: PILOT },
      { mediaItemId: FIRST },
      { seriesId: SHOW },
      { mediaItemId: SECOND },
      { mediaItemId: NOWHERE },
    ]);

    const read = await collections.get(ADMIN, made.id);

    expect(read?.entries.map((entry) => [entry.kind, entry.media.id])).toEqual([
      ['film', SECOND],
      ['series', PILOT],
      ['film', FIRST],
    ]);
    expect(read?.collection).toMatchObject({ name: 'Saga', isOrdered: true, entryCount: 3 });
  });

  it('tiles its cover from the posters there are, a programme by an episode that has one', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Saga',
      createdBy: null,
      entries: [{ mediaItemId: SECOND }, { seriesId: SHOW }, { mediaItemId: FIRST }],
    });

    expect(made.coverMediaIds).toEqual([PILOT, FIRST]);
  });

  it('replaces what was there rather than adding to it', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Saga',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }],
    });

    await expect(collections.replaceEntries(made.id, [{ mediaItemId: SECOND }])).resolves.toBe(
      true,
    );

    const read = await collections.get(ADMIN, made.id);

    expect(read?.entries.map((entry) => entry.media.id)).toEqual([SECOND]);
  });

  it('says there is nothing to replace in a collection that does not exist', async () => {
    const { collections } = await aServer();

    await expect(collections.replaceEntries(NOWHERE, [{ mediaItemId: FIRST }])).resolves.toBe(
      false,
    );
  });

  it('leaves out what somebody may not reach, and a programme with no episode they may see', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Everything',
      createdBy: null,
      entries: [
        { mediaItemId: FIRST },
        { mediaItemId: GROWN_UP },
        { mediaItemId: BEHIND_A_LOCK },
        { seriesId: SHOW },
      ],
    });

    const read = await collections.get(KID, made.id);

    expect(read?.entries.map((entry) => entry.media.id)).toEqual([FIRST, PILOT]);
    expect(read?.collection.entryCount).toBe(2);
  });

  it('does not offer a collection holding nothing somebody may see, unless the empty ones are asked for', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Grown-ups',
      createdBy: null,
      entries: [{ mediaItemId: GROWN_UP }, { mediaItemId: BEHIND_A_LOCK }],
    });

    await expect(collections.list(KID)).resolves.toEqual([]);
    await expect(collections.get(KID, made.id)).resolves.toBeNull();
    expect((await collections.list(KID, { withEmpty: true })).map((one) => one.id)).toEqual([
      made.id,
    ]);
  });

  it('hides a programme the viewer hid themselves', async () => {
    const { db, collections } = await aServer();

    await db.insert(hidden).values({ id: 'hide-show', profileId: 'kid-face', seriesId: SHOW });

    const made = await collections.create({
      name: 'Shows',
      createdBy: null,
      entries: [{ seriesId: SHOW }, { mediaItemId: FIRST }],
    });
    const read = await collections.get(KID, made.id);

    expect(read?.entries.map((entry) => entry.kind)).toEqual(['film']);
  });

  it('finds the collections a title is in, a programme by any of its episodes', async () => {
    const { collections } = await aServer();
    const holding = await collections.create({
      name: 'Holding',
      createdBy: null,
      entries: [{ seriesId: SHOW }],
    });

    await collections.create({ name: 'Other', createdBy: null, entries: [{ mediaItemId: FIRST }] });

    expect(
      (await collections.list(ADMIN, { containing: { mediaItemId: FINALE } })).map((one) => one.id),
    ).toEqual([holding.id]);
    await expect(
      collections.list(ADMIN, { containing: { mediaItemId: NOWHERE } }),
    ).resolves.toEqual([]);
  });

  it('adds only what is not there already, to the end', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Saga',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }],
    });

    await expect(
      collections.add(made.id, [{ mediaItemId: FIRST }, { mediaItemId: SECOND }]),
    ).resolves.toBe(1);
    await expect(collections.add(NOWHERE, [{ mediaItemId: FIRST }])).resolves.toBeNull();

    const read = await collections.get(ADMIN, made.id);

    expect(read?.entries.map((entry) => entry.media.id)).toEqual([FIRST, SECOND]);
  });

  it('moves an entry to the top, and after another', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Saga',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }, { mediaItemId: SECOND }, { seriesId: SHOW }],
    });
    const before = await collections.get(ADMIN, made.id);
    const [first, second, third] = before?.entries ?? [];

    await expect(collections.move(made.id, third?.id ?? '', null)).resolves.toBe(true);
    await expect(collections.move(made.id, first?.id ?? '', second?.id ?? '')).resolves.toBe(true);
    await expect(collections.move(made.id, NOWHERE, null)).resolves.toBe(false);

    const after = await collections.get(ADMIN, made.id);

    expect(after?.entries.map((entry) => entry.media.id)).toEqual([PILOT, SECOND, FIRST]);
  });

  it('says whether there was an entry to take out', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Saga',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }],
    });
    const entryId = (await collections.get(ADMIN, made.id))?.entries[0]?.id ?? '';

    await expect(collections.drop(made.id, entryId)).resolves.toBe(true);
    await expect(collections.drop(made.id, entryId)).resolves.toBe(false);
  });

  it('loses an entry when the film it was of is deleted', async () => {
    const { db, collections } = await aServer();
    const made = await collections.create({
      name: 'Saga',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }, { mediaItemId: SECOND }],
    });

    await db.delete(mediaItem).where(eq(mediaItem.id, FIRST));

    expect((await collections.get(ADMIN, made.id))?.collection.entryCount).toBe(1);
  });

  it('renames, describes and orders, and answers nothing for a collection that is not there', async () => {
    const { collections } = await aServer();
    const made = await collections.create({ name: 'Saga', createdBy: null });

    await expect(
      collections.update(made.id, { name: 'Trilogy', description: 'Three', isOrdered: true }),
    ).resolves.toMatchObject({ name: 'Trilogy', description: 'Three', isOrdered: true });
    await expect(collections.update(NOWHERE, { name: 'Nothing' })).resolves.toBeNull();
  });

  it('deletes a collection once, and says each change it made', async () => {
    const { collections, onChanged } = await aServer();
    const made = await collections.create({ name: 'Saga', createdBy: null });

    await expect(collections.remove(made.id)).resolves.toBe(true);
    await expect(collections.remove(made.id)).resolves.toBe(false);
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it('keeps artwork of its own, and lets it go again', async () => {
    const { collections } = await aServer();
    const made = await collections.create({ name: 'Saga', createdBy: null });
    const picture = new Uint8Array(
      await sharp({
        create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .png()
        .toBuffer(),
    );

    await expect(
      collections.saveArtwork(made.id, { body: picture, contentType: 'image/png' }),
    ).resolves.toBeNull();
    await expect(collections.readArtwork(ADMIN, made.id)).resolves.toMatchObject({
      contentType: 'image/png',
    });
    expect((await collections.list(ADMIN, { withEmpty: true }))[0]?.hasOwnArtwork).toBe(true);
    await expect(collections.dropArtwork(made.id)).resolves.toBe(true);
    await expect(collections.readArtwork(ADMIN, made.id)).resolves.toBeNull();
  });

  it('refuses artwork that is not a picture, or for a collection that is not there', async () => {
    const { collections } = await aServer();
    const made = await collections.create({ name: 'Saga', createdBy: null });
    const notAPicture = { body: new Uint8Array([1, 2, 3]), contentType: 'image/png' };

    await expect(collections.saveArtwork(made.id, notAPicture)).resolves.not.toBeNull();
    await expect(collections.saveArtwork(NOWHERE, notAPicture)).resolves.toBe('missing');
    await expect(collections.dropArtwork(NOWHERE)).resolves.toBe(false);
  });

  it('fills a smart collection from its rules, for whoever is looking, in its order', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Films',
      createdBy: 'admin',
      rules: FILMS_BY_TITLE,
    });

    expect(made).toMatchObject({ isSmart: true, isOrdered: true, holds: ['film'], owner: null });
    expect((await collections.get(ADMIN, made.id))?.entries.map((entry) => entry.media.id)).toEqual(
      [FIRST, SECOND, GROWN_UP, BEHIND_A_LOCK],
    );
    expect((await collections.get(KID, made.id))?.entries.map((entry) => entry.media.id)).toEqual([
      FIRST,
      SECOND,
    ]);
  });

  it('gives each of its entries the same id every time it is read', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Films',
      createdBy: 'admin',
      rules: FILMS_BY_TITLE,
    });
    const first = await collections.get(KID, made.id);
    const again = await collections.get(KID, made.id);

    expect(again?.entries.map((entry) => entry.id)).toEqual(
      first?.entries.map((entry) => entry.id),
    );
  });

  it('reads the viewer’s watching for the server’s, and its owner’s for somebody’s own', async () => {
    const { db, collections } = await aServer();

    await db.insert(watchProgress).values({
      id: 'p1',
      profileId: 'kid-face',
      mediaItemId: FIRST,
      positionSeconds: 5400,
      durationSeconds: 5400,
      isFinished: true,
    });

    const theServers = await collections.create({
      name: 'Seen',
      createdBy: 'admin',
      rules: FINISHED,
    });
    const theKids = await collections.create({
      name: 'Mine',
      createdBy: 'kid',
      rules: FINISHED,
      profileId: 'kid-face',
      isShared: true,
    });

    expect(
      (await collections.get(KID, theServers.id))?.entries.map((entry) => entry.media.id),
    ).toEqual([FIRST]);
    expect((await collections.get(ADMIN, theServers.id, true))?.entries).toEqual([]);
    expect(
      (await collections.get(ADMIN, theKids.id))?.entries.map((entry) => entry.media.id),
    ).toEqual([FIRST]);
  });

  it('keeps somebody’s own collection to them until it is shared', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Mine',
      createdBy: 'kid',
      rules: FILMS_BY_TITLE,
      profileId: 'kid-face',
    });

    expect((await collections.list(KID)).map((one) => [one.name, one.isMine])).toEqual([
      ['Mine', true],
    ]);
    expect(await collections.list(ADMIN, { withEmpty: true })).toEqual([]);
    await expect(collections.get(ADMIN, made.id, true)).resolves.toBeNull();

    await collections.update(made.id, { isShared: true });

    expect((await collections.list(ADMIN)).map((one) => [one.name, one.isMine])).toEqual([
      ['Mine', false],
    ]);
  });

  it('offers somebody their own collection while nothing keeps its rules', async () => {
    const { collections } = await aServer();

    await collections.create({
      name: 'Mine',
      createdBy: 'kid',
      rules: { ...FILMS_BY_TITLE, rules: [{ kind: 'released', from: 1800, to: 1801 }] },
      profileId: 'kid-face',
    });

    expect((await collections.list(KID)).map((one) => [one.name, one.entryCount])).toEqual([
      ['Mine', 0],
    ]);
  });

  it('adds nothing to a smart collection, and moves or takes nothing out of it', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Films',
      createdBy: 'admin',
      rules: FILMS_BY_TITLE,
    });
    const [entry] = (await collections.get(ADMIN, made.id))?.entries ?? [];

    await expect(collections.add(made.id, [{ mediaItemId: FIRST }])).resolves.toBeNull();
    await expect(collections.replaceEntries(made.id, [{ mediaItemId: FIRST }])).resolves.toBe(
      false,
    );
    await expect(collections.move(made.id, entry?.id ?? '', null)).resolves.toBe(false);
  });

  it('changes the rules only of a smart collection, and shares only somebody’s own', async () => {
    const { collections } = await aServer();
    const byHand = await collections.create({ name: 'Saga', createdBy: 'admin' });
    const smart = await collections.create({
      name: 'Films',
      createdBy: 'admin',
      rules: FILMS_BY_TITLE,
    });

    await expect(collections.update(byHand.id, { rules: FILMS_BY_TITLE })).resolves.toBeNull();
    await expect(collections.update(smart.id, { isShared: true })).resolves.toBeNull();
    await expect(
      collections.update(smart.id, { rules: { ...FILMS_BY_TITLE, limit: 1 } }, ADMIN),
    ).resolves.toMatchObject({ entryCount: 1, rules: { limit: 1 } });
  });

  it('leaves smart collections out of what a title is part of', async () => {
    const { collections } = await aServer();

    await collections.create({ name: 'Smart', createdBy: 'admin', rules: FILMS_BY_TITLE });
    await collections.create({
      name: 'Saga',
      createdBy: 'admin',
      entries: [{ mediaItemId: FIRST }],
    });

    expect(
      (await collections.list(ADMIN, { containing: { mediaItemId: FIRST } })).map(
        (one) => one.name,
      ),
    ).toEqual(['Saga']);
  });

  it('says what each collection holds: what is in it, or both while it is empty', async () => {
    const { collections } = await aServer();
    const films = await collections.create({
      name: 'Films',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }],
    });
    const mixed = await collections.create({
      name: 'Mixed',
      createdBy: null,
      entries: [{ mediaItemId: FIRST }, { seriesId: SHOW }],
    });
    const empty = await collections.create({ name: 'Empty', createdBy: null });

    expect(films.holds).toEqual(['film']);
    expect(mixed.holds).toEqual(['film', 'series']);
    expect(empty.holds).toEqual(['film', 'series']);
  });

  it('shows the artwork of somebody’s own collection to nobody else until it is shared', async () => {
    const { collections } = await aServer();
    const made = await collections.create({
      name: 'Mine',
      createdBy: 'kid',
      rules: FILMS_BY_TITLE,
      profileId: 'kid-face',
    });
    const picture = new Uint8Array(
      await sharp({
        create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .png()
        .toBuffer(),
    );

    await collections.saveArtwork(made.id, { body: picture, contentType: 'image/png' });

    await expect(collections.readArtwork(KID, made.id)).resolves.not.toBeNull();
    await expect(collections.readArtwork(ADMIN, made.id)).resolves.toBeNull();
  });
});
