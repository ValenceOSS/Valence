import { randomUUID } from 'node:crypto';
import { HOME_ROW_SIZE } from '@ValenceContracts/constants/HOME_ROW_SIZE';
import { collapseToShows } from '@ValenceCore/functions/collapseToShows';
import { roundOrder } from '@ValenceCore/functions/roundOrder';
import type { HomeShelf, HomeShelves } from '@ValenceContracts/schemas/HomeShelves';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ListItemsOptions } from '@ValenceServer/library/LibraryService';

const READ = HOME_ROW_SIZE.most * 2;

const DECADE_SPAN = 9;

const AT_ONCE = 8;

const KEPT_FOR_MS = 30 * 60 * 1000;

const MOST_KEPT = 500;

const ORDERS = ['newest', 'title'] as const;

type Viewed<Viewer> = {
  listItems: (
    viewer: Viewer,
    libraryIds: readonly string[],
    options: ListItemsOptions & { counted?: boolean },
  ) => Promise<{ items: MediaSummary[]; total: number }>;
  listFacets: (viewer: Viewer) => Promise<{ genres: string[]; decades: number[] }>;
  now?: () => number;
};

type Spec = Omit<HomeShelf, 'items' | 'id'>;

type Walk = {
  specs: Spec[];
  at: number;
  hasAngles: boolean;
  placed: Set<string>;
  drawn: HomeShelf[];
  shownGenres: string[];
  decades: number[];
  pagesOf: Map<string, number>;
  again: number;
  touchedAt: number;
};

/**
 * Names a shelf by what it is drawn from, so the same shelf keeps its name from one page to the next.
 *
 * @param spec - What the shelf is drawn from.
 * @returns Its name.
 */
const idOf = ({ kind, genre, order, decade, page }: Spec): string =>
  kind === 'genre'
    ? `genre:${genre ?? ''}`
    : kind === 'decade'
      ? `decade:${(decade ?? 0).toString()}`
      : ['more', genre ?? '', order ?? '', (decade ?? '').toString(), page.toString()].join(':');

/**
 * What to ask the libraries for to fill a shelf: the best-rated of a genre or a decade, a genre in
 * another order or narrowed to a decade, or the next of a genre's best.
 *
 * @param spec - What the shelf is drawn from.
 * @returns The question.
 */
const askedFor = ({
  kind,
  genre,
  order,
  decade,
  page,
}: Spec): ListItemsOptions & { counted?: boolean } => ({
  limit: READ,
  order: order ?? 'rated',
  ...(genre === null ? {} : { genre }),
  ...(decade === null ? {} : { yearFrom: decade, yearTo: decade + DECADE_SPAN }),
  offset: page * READ,
  counted: kind === 'genre',
});

/**
 * Lays out the shelves past the genres and decades: each genre shown in every other order, each
 * genre narrowed to each decade, and each genre's next best, taken in turn so the page does not run
 * through one angle before the next.
 *
 * @param walk - How far the page has got.
 * @returns The shelves to try next.
 */
const anglesOf = (walk: Walk): Spec[] => {
  const orders = ORDERS.flatMap((order) =>
    walk.shownGenres.map((genre): Spec => ({ kind: 'more', genre, order, decade: null, page: 0 })),
  );
  const eras = walk.decades.flatMap((decade) =>
    walk.shownGenres.map((genre): Spec => ({ kind: 'more', genre, order: null, decade, page: 0 })),
  );
  const deepest = Math.max(0, ...walk.pagesOf.values());
  const deeper = Array.from({ length: Math.max(0, deepest - 1) }, (_, at) => at + 1).flatMap(
    (page) =>
      walk.shownGenres
        .filter((genre) => page < (walk.pagesOf.get(genre) ?? 0))
        .map((genre): Spec => ({ kind: 'more', genre, order: null, decade: null, page })),
  );
  const longest = Math.max(orders.length, eras.length, deeper.length);

  return Array.from({ length: longest }, (_, at) => [orders[at], eras[at], deeper[at]]).flatMap(
    (three) => three.filter((one): one is Spec => one !== undefined),
  );
};

/**
 * Serves the endless part of the front page a page of shelves at a time: first a shelf for each
 * genre, those somebody leans towards first, then each decade, then each genre from other angles,
 * and once every one has been shown, the same shelves come round again, each round in an order of
 * its own, for as long as somebody scrolls.
 *
 * A title is shown on one shelf only, so a shelf whose titles have all been shown already is passed
 * over and the next tried in its place. Which have been shown is remembered on the server against
 * the page's cursor, for half an hour, so each page carries on from the last without the browser
 * sending back everything it has.
 *
 * The shelves are read several at a time and kept in the order they were asked for, so a page costs
 * a handful of round trips to the database rather than one per shelf.
 *
 * @param options - How to read the libraries and what they hold.
 * @returns How to read a page of shelves.
 */
const createHomeShelves = <Viewer>({ listItems, listFacets, now = Date.now }: Viewed<Viewer>) => {
  const walks = new Map<string, Walk>();

  /**
   * Lets go of walks nobody has carried on with for a while, and the oldest where too many are kept.
   */
  const forgetOld = (): void => {
    const cutOff = now() - KEPT_FOR_MS;

    for (const [cursor, walk] of walks) {
      if (walk.touchedAt < cutOff || walks.size > MOST_KEPT) {
        walks.delete(cursor);
      }
    }
  };

  /**
   * Begins a page from the top: every genre, those leaned towards first, then every decade, newest
   * first.
   *
   * @param viewer - Who is looking.
   * @param leaning - The genres they lean towards, most first.
   * @returns The walk, at its start.
   */
  const begin = async (viewer: Viewer, leaning: readonly string[]): Promise<Walk> => {
    const facets = await listFacets(viewer);
    const genres = [
      ...new Set([...leaning.filter((one) => facets.genres.includes(one)), ...facets.genres]),
    ];
    const decades = [...facets.decades].sort((left, right) => right - left);

    return {
      specs: [
        ...genres.map((genre): Spec => ({
          kind: 'genre',
          genre,
          order: null,
          decade: null,
          page: 0,
        })),
        ...decades.map((decade): Spec => ({
          kind: 'decade',
          genre: null,
          order: null,
          decade,
          page: 0,
        })),
      ],
      at: 0,
      hasAngles: false,
      placed: new Set(),
      drawn: [],
      shownGenres: [],
      decades,
      pagesOf: new Map(),
      again: 0,
      touchedAt: now(),
    };
  };

  /**
   * Reads the next shelves that have something new on them, trying several at once.
   *
   * @param viewer - Who is looking.
   * @param libraryIds - The libraries the page is drawn from.
   * @param walk - How far the page has got.
   * @param count - How many shelves are wanted.
   * @returns The shelves.
   */
  const fill = async (
    viewer: Viewer,
    libraryIds: readonly string[],
    walk: Walk,
    count: number,
  ): Promise<HomeShelf[]> => {
    const shelves: HomeShelf[] = [];

    while (shelves.length < count) {
      if (walk.at >= walk.specs.length && !walk.hasAngles) {
        walk.specs.push(...anglesOf(walk));
        walk.hasAngles = true;
      }

      if (walk.at >= walk.specs.length) {
        break;
      }

      const batch = walk.specs.slice(walk.at, walk.at + AT_ONCE);
      const read = await Promise.all(
        batch.map((spec) =>
          listItems(viewer, libraryIds, askedFor(spec)).catch(() => ({ items: [], total: 0 })),
        ),
      );

      walk.at += batch.length;

      for (const [index, spec] of batch.entries()) {
        const answer = read[index] ?? { items: [], total: 0 };
        const fresh = collapseToShows(answer.items)
          .filter((media) => !walk.placed.has(media.id))
          .slice(0, HOME_ROW_SIZE.most);

        if (spec.kind === 'genre' && spec.genre !== null) {
          walk.pagesOf.set(spec.genre, Math.ceil(answer.total / READ));
        }

        if (fresh.length < HOME_ROW_SIZE.fewest) {
          continue;
        }

        const shelf: HomeShelf = { ...spec, id: idOf(spec), items: fresh };

        for (const media of fresh) {
          walk.placed.add(media.id);
        }

        if (spec.kind === 'genre' && spec.genre !== null) {
          walk.shownGenres.push(spec.genre);
        }

        walk.drawn.push(shelf);
        shelves.push(shelf);
      }
    }

    while (shelves.length < count && walk.drawn.length > 0) {
      const round = Math.floor(walk.again / walk.drawn.length) + 1;
      const place = walk.again % walk.drawn.length;
      const shelf = walk.drawn[roundOrder(walk.drawn.length, round)[place] ?? place];

      walk.again += 1;

      if (shelf !== undefined) {
        shelves.push({
          ...shelf,
          kind: 'again',
          id: ['again', round.toString(), place.toString()].join(':'),
        });
      }
    }

    return shelves;
  };

  return {
    read: async (
      viewer: Viewer,
      asked: {
        libraryIds: readonly string[];
        leaning: readonly string[];
        cursor?: string;
        count: number;
      },
    ): Promise<HomeShelves> => {
      forgetOld();

      const kept = asked.cursor === undefined ? undefined : walks.get(asked.cursor);
      const walk = kept ?? (await begin(viewer, asked.leaning));

      if (asked.cursor !== undefined) {
        walks.delete(asked.cursor);
      }

      const shelves = await fill(viewer, asked.libraryIds, walk, asked.count);
      const isOver = shelves.length === 0 || walk.drawn.length === 0;

      if (isOver) {
        return { shelves, cursor: null };
      }

      const cursor = randomUUID();

      walk.touchedAt = now();
      walks.set(cursor, walk);

      return { shelves, cursor };
    },
  };
};

export { createHomeShelves };
