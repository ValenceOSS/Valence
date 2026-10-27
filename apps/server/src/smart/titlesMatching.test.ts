import { describe, expect, it } from 'vitest';
import { hidden, library, mediaItem, rating, series, watchProgress } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { titlesMatching } from './titlesMatching';
import type { TitleRule, TitleRules } from '@ValenceContracts/schemas/SmartRules';

const STARTING_POSTGRES_MS = 60_000;

const NOW = new Date('2026-10-27T12:00:00.000Z');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A moment some whole days before now.
 *
 * @param days - How many days.
 * @returns The moment.
 */
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

/**
 * A household with three films and two programmes, some of them watched and rated by Pat: a short
 * comedy from the nineties added this week, a long drama from 2005, a comedy drama for grown-ups
 * that nobody has rated, a comedy programme Pat is part way through and a drama programme Pat gave
 * four stars and has not started.
 *
 * @returns The database and Pat watching.
 */
const aShelf = async () => {
  const household = await aHousehold();
  const { db } = household;

  await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' });
  await db.insert(series).values([
    { id: 'sitcom', libraryId: 'shows', key: 'sitcom', title: 'Sitcom' },
    { id: 'saga', libraryId: 'shows', key: 'saga', title: 'Saga' },
  ]);
  await db.insert(mediaItem).values([
    {
      ...aMediaItemRow('short', 'films'),
      title: 'Short',
      year: 1994,
      durationSeconds: 90 * 60,
      genres: ['Comedy'],
      rating: 8,
      certificationAge: 12,
      addedAt: daysAgo(3),
    },
    {
      ...aMediaItemRow('long', 'films'),
      title: 'Long',
      year: 2005,
      durationSeconds: 140 * 60,
      genres: ['Drama'],
      rating: 6,
      certificationAge: 15,
      addedAt: daysAgo(100),
    },
    {
      ...aMediaItemRow('grown', 'films'),
      title: 'Grown',
      year: 1999,
      durationSeconds: 95 * 60,
      genres: ['Comedy', 'Drama'],
      certificationAge: 18,
      addedAt: daysAgo(40),
    },
    {
      ...aMediaItemRow('sitcom-1', 'shows'),
      seriesId: 'sitcom',
      seriesTitle: 'Sitcom',
      year: 2010,
      genres: ['Comedy'],
      rating: 7.5,
      certificationAge: 12,
      addedAt: daysAgo(200),
    },
    {
      ...aMediaItemRow('sitcom-2', 'shows'),
      seriesId: 'sitcom',
      seriesTitle: 'Sitcom',
      year: 2011,
      genres: ['Comedy'],
      rating: 7.5,
      certificationAge: 12,
      addedAt: daysAgo(5),
    },
    {
      ...aMediaItemRow('saga-1', 'shows'),
      seriesId: 'saga',
      seriesTitle: 'Saga',
      year: 2020,
      genres: ['Drama'],
      rating: 9,
      certificationAge: 15,
      addedAt: daysAgo(60),
    },
  ]);
  await db.insert(watchProgress).values([
    {
      id: 'p1',
      profileId: 'pat',
      mediaItemId: 'short',
      positionSeconds: 5400,
      durationSeconds: 5400,
      isFinished: true,
    },
    {
      id: 'p2',
      profileId: 'pat',
      mediaItemId: 'grown',
      positionSeconds: 600,
      durationSeconds: 5700,
      isFinished: false,
    },
    {
      id: 'p3',
      profileId: 'pat',
      mediaItemId: 'sitcom-1',
      positionSeconds: 5400,
      durationSeconds: 5400,
      isFinished: true,
    },
    {
      id: 'p4',
      profileId: 'sam',
      mediaItemId: 'long',
      positionSeconds: 8400,
      durationSeconds: 8400,
      isFinished: true,
    },
  ]);
  await db.insert(rating).values([
    { id: 'r1', profileId: 'pat', mediaItemId: 'short', stars: 5 },
    { id: 'r2', profileId: 'pat', seriesId: 'saga', stars: 4 },
  ]);

  /**
   * What a smart collection with these rules holds for Pat, as kind and id.
   *
   * @param rules - The collection's rules, beyond what it holds, in what order and how many.
   * @param profileId - Whose viewing the rules read.
   * @returns What it holds, in order.
   */
  const holds = async (rules: Partial<TitleRules>, profileId: string | null = 'pat') =>
    (
      await titlesMatching(db, {
        listId: 'list',
        viewer: household.viewer,
        profileId,
        rules: { holds: 'films', rules: [], order: 'title', limit: null, ...rules },
        now: NOW,
      })
    ).map((title) => `${title.kind}:${title.id}`);

  /**
   * What a smart collection of films with these rules holds, then one of programmes.
   *
   * @param rules - The collections' rules, beyond what they hold.
   * @returns What they hold, films first.
   */
  const everything = async (rules: Partial<TitleRules>) => [
    ...(await holds({ ...rules, holds: 'films' })),
    ...(await holds({ ...rules, holds: 'series' })),
  ];

  return { ...household, holds, everything };
};

/**
 * What one rule lets into a collection of films and into one of programmes, by title.
 *
 * @param everything - How the shelf is asked.
 * @param rule - The rule.
 * @returns What they hold, films first.
 */
const keeping = (
  everything: Awaited<ReturnType<typeof aShelf>>['everything'],
  rule: TitleRule,
): Promise<string[]> => everything({ rules: [rule] });

describe('titlesMatching', { timeout: STARTING_POSTGRES_MS }, () => {
  it('holds films or programmes, each once, programmes standing for their episodes', async () => {
    const { holds } = await aShelf();

    await expect(holds({ holds: 'films' })).resolves.toEqual([
      'film:film',
      'film:grown',
      'film:long',
      'film:short',
    ]);
    await expect(holds({ holds: 'series' })).resolves.toEqual(['series:saga', 'series:sitcom']);
  });

  it('keeps a genre, or keeps it out, judging a programme by its episodes', async () => {
    const { everything } = await aShelf();

    await expect(
      keeping(everything, { kind: 'genre', anyOf: ['Comedy'], isNegated: false }),
    ).resolves.toEqual(['film:grown', 'film:short', 'series:sitcom']);
    await expect(
      keeping(everything, { kind: 'genre', anyOf: ['Comedy'], isNegated: true }),
    ).resolves.toEqual(['film:film', 'film:long', 'series:saga']);
  });

  it('keeps the years asked for, a programme by when its first episode came out', async () => {
    const { everything } = await aShelf();

    await expect(keeping(everything, { kind: 'released', from: 1990, to: 1999 })).resolves.toEqual([
      'film:grown',
      'film:short',
    ]);
    await expect(keeping(everything, { kind: 'released', from: 2010, to: 2010 })).resolves.toEqual([
      'series:sitcom',
    ]);
  });

  it('keeps films of the length asked for and never a programme', async () => {
    const { everything } = await aShelf();

    await expect(
      keeping(everything, { kind: 'runtime', atLeastMinutes: null, atMostMinutes: 100 }),
    ).resolves.toEqual(['film:film', 'film:grown', 'film:short']);
    await expect(
      keeping(everything, { kind: 'runtime', atLeastMinutes: 120, atMostMinutes: null }),
    ).resolves.toEqual(['film:long']);
  });

  it('keeps what the profile has not started, is part way through, finished or not finished', async () => {
    const { everything } = await aShelf();

    await expect(keeping(everything, { kind: 'watched', state: 'unwatched' })).resolves.toEqual([
      'film:film',
      'film:long',
      'series:saga',
    ]);
    await expect(keeping(everything, { kind: 'watched', state: 'inProgress' })).resolves.toEqual([
      'film:grown',
      'series:sitcom',
    ]);
    await expect(keeping(everything, { kind: 'watched', state: 'finished' })).resolves.toEqual([
      'film:short',
    ]);
    await expect(keeping(everything, { kind: 'watched', state: 'notFinished' })).resolves.toEqual([
      'film:film',
      'film:grown',
      'film:long',
      'series:saga',
      'series:sitcom',
    ]);
  });

  it('counts a programme finished with only its specials left', async () => {
    const { db, holds } = await aShelf();

    await db.insert(mediaItem).values({
      ...aMediaItemRow('sitcom-special', 'shows'),
      seriesId: 'sitcom',
      seriesTitle: 'Sitcom',
      seasonNumber: 0,
    });
    await db.insert(watchProgress).values({
      id: 'p5',
      profileId: 'pat',
      mediaItemId: 'sitcom-2',
      positionSeconds: 5400,
      durationSeconds: 5400,
      isFinished: true,
    });

    await expect(
      holds({ holds: 'series', rules: [{ kind: 'watched', state: 'finished' }] }),
    ).resolves.toEqual(['series:sitcom']);
  });

  it('reads whose viewing it is told to, and treats nobody as having watched nothing', async () => {
    const { holds } = await aShelf();

    await expect(
      holds({ holds: 'films', rules: [{ kind: 'watched', state: 'finished' }] }, 'sam'),
    ).resolves.toEqual(['film:long']);
    await expect(
      holds({ holds: 'films', rules: [{ kind: 'watched', state: 'finished' }] }, null),
    ).resolves.toEqual([]);
  });

  it('keeps what is rated well enough, a programme by its best episode', async () => {
    const { everything } = await aShelf();

    await expect(keeping(everything, { kind: 'rating', atLeast: 7.5 })).resolves.toEqual([
      'film:short',
      'series:saga',
      'series:sitcom',
    ]);
  });

  it('keeps what the profile gave enough stars, a programme by its own stars', async () => {
    const { everything } = await aShelf();

    await expect(keeping(everything, { kind: 'yourStars', atLeast: 4 })).resolves.toEqual([
      'film:short',
      'series:saga',
    ]);
  });

  it('keeps what was added lately, a programme by its newest episode', async () => {
    const { everything } = await aShelf();

    await expect(keeping(everything, { kind: 'added', withinDays: 30 })).resolves.toEqual([
      'film:film',
      'film:short',
      'series:sitcom',
    ]);
  });

  it('keeps the libraries asked for and what is suitable up to an age', async () => {
    const { everything } = await aShelf();

    await expect(keeping(everything, { kind: 'library', anyOf: ['shows'] })).resolves.toEqual([
      'series:saga',
      'series:sitcom',
    ]);
    await expect(keeping(everything, { kind: 'ageRating', atMost: 12 })).resolves.toEqual([
      'film:short',
      'series:sitcom',
    ]);
  });

  it('keeps only what every rule keeps', async () => {
    const { everything } = await aShelf();

    await expect(
      everything({
        rules: [
          { kind: 'genre', anyOf: ['Comedy'], isNegated: false },
          { kind: 'watched', state: 'notFinished' },
        ],
      }),
    ).resolves.toEqual(['film:grown', 'series:sitcom']);
  });

  it('orders what it holds, and holds no more than its limit', async () => {
    const { holds } = await aShelf();

    await expect(holds({ order: 'added', limit: 2 })).resolves.toEqual(['film:film', 'film:short']);
    await expect(holds({ order: 'released', limit: 2 })).resolves.toEqual([
      'film:long',
      'film:grown',
    ]);
    await expect(holds({ holds: 'series', order: 'added' })).resolves.toEqual([
      'series:sitcom',
      'series:saga',
    ]);
    await expect(holds({ holds: 'series', order: 'released' })).resolves.toEqual([
      'series:saga',
      'series:sitcom',
    ]);
    await expect(holds({ holds: 'series', order: 'rating' })).resolves.toEqual([
      'series:saga',
      'series:sitcom',
    ]);
    await expect(holds({ order: 'yourStars', limit: 1 })).resolves.toEqual(['film:short']);
  });

  it('shuffles the same way all day, and every title still comes once', async () => {
    const { holds } = await aShelf();
    const first = await holds({ order: 'random' });

    await expect(holds({ order: 'random' })).resolves.toEqual(first);
    expect([...first].sort()).toEqual((await holds({})).sort());
  });

  it('leaves out what the viewer has hidden', async () => {
    const { db, holds } = await aShelf();

    await db.insert(hidden).values({ id: 'h1', profileId: 'pat', mediaItemId: 'short' });

    await expect(holds({ holds: 'films' })).resolves.toEqual([
      'film:film',
      'film:grown',
      'film:long',
    ]);
  });
});
