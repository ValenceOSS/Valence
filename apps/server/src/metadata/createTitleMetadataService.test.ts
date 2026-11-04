import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, series, user } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createTitleEditStore } from './createTitleEditStore';
import { createTitleMetadataService } from './createTitleMetadataService';

const STARTING_DATABASE_MS = 60_000;

const ADA = { id: 'ada', name: 'Ada' };

/**
 * A service over a fresh database holding a film in two versions and a programme of two episodes.
 *
 * @returns The service, its database, and the shape it reads programmes from.
 */
const aService = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db.insert(library).values({ id: 'lib', name: 'Everything', kind: 'movies', path: '/lib' });
  await db
    .insert(series)
    .values({ id: 'show', libraryId: 'lib', key: 'folder:Show', title: 'Show' });
  await db.insert(mediaItem).values([
    {
      ...aMediaItemRow('cut', 'lib'),
      title: 'A film',
      externalId: '603',
      year: 2001,
      releaseDate: '2001-05-04',
      certifications: { GB: '12A', US: 'PG-13' },
      certificationAge: 12,
    },
    {
      ...aMediaItemRow('extended', 'lib'),
      title: 'A film',
      externalId: '603',
      year: 2001,
      releaseDate: '2001-05-04',
      certifications: { GB: '12A', US: 'PG-13' },
      certificationAge: 12,
    },
    {
      ...aMediaItemRow('pilot', 'lib'),
      title: 'Pilot',
      externalId: '1',
      seriesId: 'show',
      seriesTitle: 'Show',
      seasonNumber: 1,
      episodeNumber: 1,
    },
    {
      ...aMediaItemRow('second', 'lib'),
      title: 'Second',
      externalId: '1',
      seriesId: 'show',
      seriesTitle: 'Show',
      seasonNumber: 1,
      episodeNumber: 2,
    },
  ]);

  const changed: string[][] = [];
  const service = createTitleMetadataService({
    db,
    edits: createTitleEditStore(db),
    certificationRegion: () => Promise.resolve('GB'),
    seriesShape: () =>
      Promise.resolve({
        seasons: [
          {
            seasonNumber: 1,
            episodeCount: 2,
            episodes: [
              {
                episodeNumber: 1,
                title: 'Pilot',
                stillUrl: null,
                overview: null,
                airDate: '2020-01-02',
              },
            ],
          },
        ],
        overview: 'What the catalogue says of the show.',
        status: 'Ended',
      }),
    onChanged: (ids) => {
      changed.push(ids);
    },
  });

  return { db, service, changed };
};

/**
 * Reads the columns an edit reaches on some files.
 *
 * @param db - The database.
 * @param ids - The files.
 * @returns Their titles, years and certificates.
 */
const readFiles = async (db: Awaited<ReturnType<typeof aService>>['db'], ids: string[]) =>
  Promise.all(
    ids.map(async (id) => {
      const [row] = await db
        .select({
          title: mediaItem.title,
          seriesTitle: mediaItem.seriesTitle,
          year: mediaItem.year,
          certificationAge: mediaItem.certificationAge,
        })
        .from(mediaItem)
        .where(eq(mediaItem.id, id));

      return row;
    }),
  );

describe('createTitleMetadataService', { timeout: STARTING_DATABASE_MS }, () => {
  it('writes a film’s edit onto every version of it at once, and says where each value came from', async () => {
    const { db, service, changed } = await aService();
    const outcome = await service.edit(
      'cut',
      'title',
      { set: { title: 'My title', releaseDate: '1999-12-31', certifications: { GB: '15' } } },
      ADA,
    );

    expect(outcome).toMatchObject({
      metadata: {
        subject: { kind: 'film', key: 'movie:603', isMatched: true },
        fields: {
          title: { value: 'My title', source: 'edited', catalogue: 'A film' },
          overview: { value: null, source: 'catalogue' },
        },
      },
    });
    await expect(readFiles(db, ['cut', 'extended'])).resolves.toEqual([
      { title: 'My title', seriesTitle: null, year: 1999, certificationAge: 15 },
      { title: 'My title', seriesTitle: null, year: 1999, certificationAge: 15 },
    ]);
    expect(changed).toEqual([['cut', 'extended']]);
  });

  it('puts a field back to the catalogue’s, and undoes a change as a whole', async () => {
    const { db, service } = await aService();
    const first = await service.edit('cut', 'title', { set: { title: 'My title' } }, ADA);
    const firstSet = typeof first === 'string' ? null : first.changeSetId;

    await service.edit('cut', 'title', { reset: ['title'] }, ADA);
    await expect(readFiles(db, ['cut'])).resolves.toMatchObject([{ title: 'A film' }]);

    await service.edit('cut', 'title', { set: { title: 'Again' } }, ADA);
    await expect(service.undo('cut', 'title', firstSet ?? '', ADA)).resolves.toBe('changedSince');

    const history = await service.history('cut', 'title');
    const latest = typeof history === 'string' ? null : (history.changes[0]?.changeSetId ?? null);

    await expect(service.undo('cut', 'title', latest ?? '', ADA)).resolves.toMatchObject({
      metadata: { fields: { title: { value: 'A film', source: 'catalogue' } } },
    });
    await expect(readFiles(db, ['cut'])).resolves.toMatchObject([{ title: 'A film' }]);
  });

  it('locks a field as it stands', async () => {
    const { service } = await aService();

    await expect(service.edit('cut', 'title', { lock: ['title'] }, ADA)).resolves.toMatchObject({
      metadata: { fields: { title: { value: 'A film', source: 'locked' } } },
    });
  });

  it('renames a programme on every episode and on the programme, and reads its overview live', async () => {
    const { db, service } = await aService();

    await expect(service.read('pilot', 'title')).resolves.toMatchObject({
      subject: { kind: 'show', key: 'tv:1' },
      fields: {
        overview: { value: 'What the catalogue says of the show.', source: 'catalogue' },
        status: { value: 'Ended' },
        releaseDate: { value: '2020-01-02' },
      },
    });

    await service.edit('pilot', 'title', { set: { title: 'My show' } }, ADA);

    const [placed] = await db.select({ title: series.title }).from(series);

    await expect(readFiles(db, ['pilot', 'second'])).resolves.toMatchObject([
      { title: 'Pilot', seriesTitle: 'My show' },
      { title: 'Second', seriesTitle: 'My show' },
    ]);
    expect(placed?.title).toBe('My show');
  });

  it('edits an episode alone', async () => {
    const { db, service } = await aService();

    await expect(
      service.edit('second', 'episode', { set: { title: 'My second' } }, ADA),
    ).resolves.toMatchObject({ metadata: { subject: { kind: 'episode', key: 'tv:1:s1e2' } } });
    await expect(readFiles(db, ['pilot', 'second'])).resolves.toMatchObject([
      { title: 'Pilot' },
      { title: 'My second' },
    ]);
  });

  it('refuses a field the title does not have, a value its rule refuses, and a file that is not there', async () => {
    const { service } = await aService();

    await expect(service.edit('cut', 'title', { set: { networks: ['A'] } }, ADA)).resolves.toBe(
      'invalid',
    );
    await expect(service.edit('cut', 'title', { set: { title: '' } }, ADA)).resolves.toBe(
      'invalid',
    );
    await expect(service.read('nothing', 'title')).resolves.toBe('missing');
    await expect(service.read('cut', 'episode')).resolves.toBe('notThisKind');
  });
});
