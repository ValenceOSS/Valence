import { describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
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
    describeCandidate: (externalId) =>
      Promise.resolve(
        externalId === '999'
          ? null
          : {
              title: 'The right film',
              year: 1999,
              overview: 'What the right film is about.',
              posterUrl: 'https://images.example/right.jpg',
              backdropUrl: null,
              genres: ['Drama'],
              runtimeMinutes: 120,
              cast: [],
              trailerKey: null,
              rating: 7.5,
              certifications: { US: 'PG-13', GB: '12A' },
              releaseDate: '1999-03-31',
            },
      ),
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

  it('writes the day a film was added onto every version of it', async () => {
    const { db, service } = await aService();

    await service.edit('cut', 'title', { set: { addedAt: '2020-01-02' } }, ADA);

    const rows = await db
      .select({ addedAt: mediaItem.addedAt })
      .from(mediaItem)
      .where(inArray(mediaItem.id, ['cut', 'extended']));

    expect(rows.map((row) => row.addedAt.toISOString())).toEqual([
      '2020-01-02T12:00:00.000Z',
      '2020-01-02T12:00:00.000Z',
    ]);
  });

  it('notes what the catalogue now says under an edit, changing nothing on the files', async () => {
    const { db, service } = await aService();

    await service.edit('cut', 'title', { set: { title: 'My title' } }, ADA);

    await expect(service.noteCatalogueChanges()).resolves.toBe(1);

    const read = await service.read('cut', 'title');

    expect(read).toMatchObject({
      fields: { title: { value: 'My title', catalogue: 'The right film' } },
    });
    await expect(readFiles(db, ['cut'])).resolves.toMatchObject([{ title: 'My title' }]);
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

  it('forgets an edit set back to what the catalogue says, an empty list the same as none', async () => {
    const { service } = await aService();

    await service.edit('cut', 'title', { set: { title: 'My title', tags: ['mine'] } }, ADA);

    await expect(
      service.edit('cut', 'title', { set: { title: 'A film', tags: [] } }, ADA),
    ).resolves.toMatchObject({
      metadata: {
        fields: { title: { source: 'catalogue' }, tags: { source: 'catalogue' } },
      },
    });
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

  it('compares a film with the entry it would be matched to, field by field', async () => {
    const { service } = await aService();

    await service.edit('cut', 'title', { set: { tagline: 'My tagline' } }, ADA);

    const preview = await service.preview('cut', { externalId: '604', kind: 'movie' });

    expect(preview).toMatchObject({
      kind: 'film',
      posterUrl: 'https://images.example/right.jpg',
    });
    const rows = typeof preview === 'string' ? [] : preview.rows;
    const rowOf = (field: string) => rows.find((row) => row.field === field);

    expect(rowOf('title')).toMatchObject({
      current: { value: 'A film', source: 'catalogue' },
      next: 'The right film',
    });
    expect(rowOf('tagline')).toMatchObject({
      current: { value: 'My tagline', source: 'edited' },
      next: null,
    });
    expect(rowOf('certifications')).toMatchObject({ next: { US: 'PG-13', GB: '12A' } });
    expect(rowOf('note')).toBeUndefined();
    await expect(service.preview('cut', { externalId: '999', kind: 'movie' })).resolves.toBe(
      'notInCatalogue',
    );
    await expect(service.preview('nothing', { externalId: '604', kind: 'movie' })).resolves.toBe(
      'missing',
    );
  });

  it('carries the fields kept, and every edit the catalogue does not fill, to the new entry', async () => {
    const { db, service } = await aService();

    await service.edit('cut', 'title', { set: { tagline: 'My tagline', note: 'Mine' } }, ADA);

    const carried = await service.carry(
      'cut',
      { externalId: '604', kind: 'movie' },
      ['title'],
      ADA,
    );
    const kept = await createTitleEditStore(db).editsFor('lib', ['movie:604']);

    expect(typeof carried === 'string' ? null : carried.changeSetId).not.toBeNull();
    expect(
      kept.map((edit) => ({ field: edit.field, value: edit.value, catalogue: edit.catalogue })),
    ).toEqual(
      expect.arrayContaining([
        { field: 'title', value: 'A film', catalogue: 'The right film' },
        { field: 'note', value: 'Mine', catalogue: null },
      ]),
    );
    expect(kept.map((edit) => edit.field)).not.toContain('tagline');
    expect(kept).toHaveLength(2);
  });

  it('carries nothing where nothing is kept or edited', async () => {
    const { service } = await aService();

    await expect(
      service.carry('cut', { externalId: '604', kind: 'movie' }, [], ADA),
    ).resolves.toEqual({ changeSetId: null });
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
