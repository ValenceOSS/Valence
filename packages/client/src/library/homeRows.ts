import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Rail } from '@ValenceClient/library/groupIntoRails';
import { say } from '@ValenceI18n/say';

type HomeRowsInput = {
  resuming: MediaSummary[];
  picked: MediaSummary[];
  recent: MediaSummary[];
  acclaimed: MediaSummary[];
  genres: { genre: string; items: MediaSummary[] }[];
  decades: { decade: number; items: MediaSummary[] }[];
  more: { id: string; title: string; items: MediaSummary[] }[];
};

const ROW_LIMIT = 20;

const MIN_ROW = 4;

/**
 * Drops the second and later appearance of anything, keeping the order it was given in.
 *
 * @param items - What might hold the same thing twice.
 * @returns Each thing once.
 */
const unique = (items: readonly MediaSummary[]): MediaSummary[] => [
  ...new Map(items.map((media) => [media.id, media])).values(),
];

/**
 * One row, or none where there is too little in it to be worth a row of its own.
 *
 * @param id - What the row is known by.
 * @param title - What the row says it is.
 * @param items - What goes in it, best first.
 * @param isCollapsed - Whether a programme's episodes stand as one card for the programme.
 * @param fewest - How few it may hold and still be drawn.
 * @returns The row, or nothing.
 */
const row = (
  id: string,
  title: string,
  items: readonly MediaSummary[],
  isCollapsed = true,
  fewest = MIN_ROW,
): Rail[] => {
  const shown = (isCollapsed ? collapseToShows(unique(items)) : unique(items)).slice(0, ROW_LIMIT);

  return shown.length < fewest ? [] : [{ id, title, items: shown }];
};

/**
 * Rows by category — genres, then decades, then the further angles on them — in which each title
 * stands once, in the first row that has it. A film that is both action and adventure is offered
 * under action and left out of adventure, rather than the same posters filling row after row. A row
 * left with too little once its repeats are gone is not drawn, and its titles stay free for the next.
 *
 * @param candidates - Each row's id, title and items, best first, in the order the rows appear.
 * @returns The rows to draw.
 */
const categoryRows = (
  candidates: readonly { id: string; title: string; items: readonly MediaSummary[] }[],
): Rail[] => {
  const placed = new Set<string>();

  return candidates.flatMap(({ id, title, items }) => {
    const fresh = collapseToShows(unique(items)).filter((media) => !placed.has(media.id));
    const drawn = row(id, title, fresh, false);

    for (const media of drawn.flatMap((one) => one.items)) {
      placed.add(media.id);
    }

    return drawn;
  });
};

/**
 * Names a decade the way somebody says it rather than as the year it happens to start on.
 *
 * @param decade - The year the decade begins.
 * @returns What the row calls itself.
 */
const decadeTitle = (decade: number): string =>
  say('client.library.homeRows.fromTheDecadeS', { decade: decade.toString() });

/**
 * The rows the front page is browsed by: carrying on, what somebody is likely to want, what is
 * new, what is well thought of, a row for each of a handful of genres, and then the decades the
 * library spans.
 *
 * Every row is bounded, so a server holding six thousand films is still a page of a dozen rows
 * rather than one row six thousand long — the rest is what the sections along the top and search
 * are for. A film may stand in one of the rows at the top and in one category besides, since a
 * thriller that is also new is both, but never in two categories.
 * Continue watching keeps each episode as itself, because which episode is the point of it.
 * Recently added is drawn with even one thing in it, since it is the row every library has — a
 * server holding three films would otherwise open on a hero over nothing.
 *
 * @param input - What each row was asked to hold.
 * @returns The rows to draw, in the order they should appear.
 */
const homeRows = ({
  resuming,
  picked,
  recent,
  acclaimed,
  genres,
  decades,
  more,
}: HomeRowsInput): Rail[] => [
  ...row('resume', say('common.continueWatching'), resuming, false, 1),
  ...row('picked', say('client.library.homeRows.pickedForYou'), picked),
  ...row('recent', say('common.recentlyAdded'), recent, true, 1),
  ...row('acclaimed', say('client.library.homeRows.criticallyAcclaimed'), acclaimed),
  ...categoryRows([
    ...genres.map(({ genre, items }) => ({ id: `genre:${genre}`, title: genre, items })),
    ...decades.map(({ decade, items }) => ({
      id: `decade:${decade.toString()}`,
      title: decadeTitle(decade),
      items,
    })),
    ...more,
  ]),
];

export type { HomeRowsInput };

export { homeRows, ROW_LIMIT, MIN_ROW };
