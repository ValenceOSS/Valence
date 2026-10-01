import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { createDatabase } from '#dialect/createDatabase';
import { NOWHERE } from '#dialect/NOWHERE';
import { sqlAsPostgresQuotes } from '@ValenceServer/testing/sqlAsPostgresQuotes';
import { book, library, mediaItem, series, share, shareVisit, user } from '#dialect/Schema';
import { columnsFor, createDatabaseShareService } from './createDatabaseShareService';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A share service over a fresh database holding one account, one film and one link to it.
 *
 * @returns The service, the database under it and the link's id.
 */
const aSharedFilm = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
  await db.insert(mediaItem).values({
    id: 'film',
    libraryId: 'films',
    path: '/films/film.mkv',
    title: 'The Film',
    sizeBytes: 1,
    modifiedAtMs: 1,
    container: 'mkv',
    durationSeconds: 60,
    videoCodec: 'h264',
    videoRange: 'sdr',
    width: 1920,
    height: 1080,
    audioStreams: [],
    subtitleStreams: [],
  });

  const service = createDatabaseShareService(db);
  const made = await service.create('ada', { kind: 'item', mediaId: 'film' });

  if (made === null) {
    throw new Error('The link was not made');
  }

  return { db, service, shareId: made.id };
};

/**
 * Builds the queries without running them. A pool connects at its first query and these never make
 * one, so the SQL can be read on a machine with no Postgres — which is what this is about, since the
 * fault was in the text of the query rather than in anything the database did with it.
 */
const asked = () => {
  const { db } = createDatabase(NOWHERE);

  const mine = sqlAsPostgresQuotes(
    db
      .select(columnsFor(db))
      .from(share)
      .leftJoin(mediaItem, eq(mediaItem.id, share.mediaItemId))
      .leftJoin(series, eq(series.id, share.seriesId))
      .leftJoin(book, eq(book.id, share.bookId))
      .where(eq(share.createdBy, 'ada'))
      .toSQL().sql,
  );

  const everybody = sqlAsPostgresQuotes(
    db
      .select({ ...columnsFor(db), createdByName: user.name })
      .from(share)
      .innerJoin(user, eq(user.id, share.createdBy))
      .leftJoin(mediaItem, eq(mediaItem.id, share.mediaItemId))
      .leftJoin(series, eq(series.id, share.seriesId))
      .leftJoin(book, eq(book.id, share.bookId))
      .toSQL().sql,
  );

  return { mine, everybody };
};

describe('counting how far a link has been used', () => {
  it('correlates the count to the share outside it, in a query over one table', () => {
    expect(asked().mine).toContain('"share"."id"');
  });

  it('does the same in a query that joins, so both listings agree', () => {
    expect(asked().everybody).toContain('"share"."id"');
  });

  it('never compares the visit’s own columns to each other, which counts nothing at all', () => {
    const { mine, everybody } = asked();

    expect(mine).not.toMatch(/where "shareId" = "id"/);
    expect(everybody).not.toMatch(/where "shareId" = "id"/);
  });

  it('reads the visits rather than any other table', () => {
    expect(asked().mine).toContain('"share_visit"');
  });
});

describe('reading what a link points at', () => {
  it('joins the title rather than asking once per link', () => {
    const { mine } = asked();

    expect(mine).toContain('"media_item"."title"');
    expect(mine).toContain('"series"."title"');
  });

  it('reaches every kind of subject from one query, since a listing holds any of them', () => {
    const { mine } = asked();

    expect(mine).toContain('left join "media_item"');
    expect(mine).toContain('left join "series"');
    expect(mine).toContain('left join "book"');
  });

  it('joins them for everybody’s links too, which is the longer list of the two', () => {
    const { everybody } = asked();

    expect(everybody).toContain('left join "media_item"');
    expect(everybody).toContain('left join "series"');
  });
});

describe('ending a link', () => {
  it(
    'ends a link of one’s own once, and not somebody else’s',
    async () => {
      const { service, shareId } = await aSharedFilm();

      await expect(service.revoke('grace', shareId)).resolves.toBe(false);
      await expect(service.revoke('ada', shareId)).resolves.toBe(true);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'tells an administrator whose link they ended and what it pointed at, the first time only',
    async () => {
      const { service, shareId } = await aSharedFilm();

      await expect(service.revokeAnybody(shareId)).resolves.toEqual({
        createdBy: 'ada',
        title: 'The Film',
      });
      await expect(service.revokeAnybody(shareId)).resolves.toBeNull();
      await expect(service.revokeAnybody('missing')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );
});

describe('joining through a link', () => {
  it(
    'keeps one visit for somebody who comes back, moving only when they were last seen',
    async () => {
      const { db, service, shareId } = await aSharedFilm();

      await service.join(shareId, 'grace');
      const [first] = await db.select().from(shareVisit);
      await service.join(shareId, 'grace');
      const visits = await db.select().from(shareVisit);

      expect(visits).toHaveLength(1);
      expect(visits[0]?.id).toBe(first?.id);
      expect(visits[0]?.firstSeenAt).toEqual(first?.firstSeenAt);
      await expect(service.hasJoined(shareId, 'grace')).resolves.toBe(true);
    },
    STARTING_POSTGRES_MS,
  );
});
