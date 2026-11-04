import { TITLE_FILTER_KINDS } from '@ValenceContracts/schemas/TitleList';
import { compareSorted } from './compareSorted';
import { valueOfSort } from './valueOfSort';
import type { ListedTitle } from './listedTitlesOf';
import type {
  TitleCounts,
  TitleFilterKind,
  TitleListQuery,
  TitleShow,
} from '@ValenceContracts/schemas/TitleList';

const DAY_MS = 86_400_000;

const YEARS = /^(\d{4})-(\d{4})$/u;

/**
 * Whether a title is among those a quick filter shows.
 *
 * @param title - The title.
 * @param show - The quick filter.
 * @returns Whether it shows.
 */
const isShown = (title: ListedTitle, show: TitleShow): boolean => {
  switch (show) {
    case 'all':
      return true;
    case 'look':
      return title.needsALook;
    case 'twice':
      return title.isTwice;
    case 'unreadable':
      return title.isUnreadable;
    case 'edited':
      return title.row.isEdited;
  }
};

/**
 * Whether a title passes one filter chip.
 *
 * @param title - The title.
 * @param kind - What the chip filters by.
 * @param value - What it asks for.
 * @param now - The time now, for how recently a title was added.
 * @returns Whether it passes.
 */
const passes = (title: ListedTitle, kind: TitleFilterKind, value: string, now: number): boolean => {
  const { row } = title;

  switch (kind) {
    case 'missing':
      return value === 'overview'
        ? !title.hasOverview
        : value === 'poster'
          ? row.posterFrom === null
          : value === 'backdrop'
            ? !title.hasBackdrop
            : value === 'logo'
              ? !title.hasLogo
              : true;
    case 'resolution':
      return row.looks.isStepMixed ? false : (row.looks.step ?? '') === value;
    case 'range':
      return title.files.some((file) => file.summary.videoRange === value);
    case 'codec':
      return title.files.some((file) => file.summary.videoCodec.toLowerCase() === value);
    case 'genre':
      return title.genres.has(value);
    case 'tag':
      return title.tags.has(value);
    case 'year': {
      const range = YEARS.exec(value);

      return (
        range !== null &&
        row.year !== null &&
        row.year >= Number(range[1]) &&
        row.year <= Number(range[2])
      );
    }
    case 'rating':
      return (title.certification ?? '') === value;
    case 'added':
      return now - Date.parse(row.latestAddedAt) <= Number(value) * DAY_MS;
    case 'subtitles':
      return value === 'yes' ? title.hasSubtitles : !title.hasSubtitles;
  }
};

/**
 * Narrows titles to those a listing asks for, by its search and its filter chips, before any
 * quick filter, so the quick filters can each say how many they would show.
 *
 * @param titles - Every title of the library.
 * @param query - The listing asked for.
 * @param now - The time now.
 * @returns The titles that pass.
 */
const narrowed = (
  titles: readonly ListedTitle[],
  query: Pick<TitleListQuery, 'search' | 'filter'>,
  now: number,
): ListedTitle[] => {
  const words = (query.search ?? '').trim().toLocaleLowerCase();
  const chips = query.filter.flatMap((one) => {
    const cut = one.indexOf(':');
    const kind = one.slice(0, cut);
    const found = TITLE_FILTER_KINDS.find((candidate) => candidate === kind);

    return cut < 0 || found === undefined ? [] : [{ kind: found, value: one.slice(cut + 1) }];
  });
  const byKind = new Map<TitleFilterKind, string[]>();

  for (const chip of chips) {
    byKind.set(chip.kind, [...(byKind.get(chip.kind) ?? []), chip.value]);
  }

  return titles.filter(
    (title) =>
      (words === '' || title.haystack.includes(words)) &&
      [...byKind.entries()].every(([kind, values]) =>
        values.some((value) => passes(title, kind, value, now)),
      ),
  );
};

/**
 * Puts titles in the order a listing asks for, ties broken by their key so the order is stable
 * from one page to the next.
 *
 * @param titles - The titles.
 * @param query - The sort and its direction.
 * @returns The titles in order.
 */
const ordered = (
  titles: readonly ListedTitle[],
  query: Pick<TitleListQuery, 'sort' | 'desc'>,
): ListedTitle[] =>
  [...titles].sort((left, right) => {
    const byValue = compareSorted(valueOfSort(left, query.sort), valueOfSort(right, query.sort));

    return (query.desc ? -byValue : byValue) || left.row.key.localeCompare(right.row.key);
  });

/**
 * The titles a listing asks for: searched and filtered by its chips, then narrowed by its quick
 * filter and put in its order, ties broken by their key so the order holds from page to page.
 *
 * @param titles - Every title of the library.
 * @param query - The listing asked for.
 * @param now - The time now, for how recently a title was added.
 * @returns The titles that passed the search and chips, how many each quick filter would show of
 *   them, and those the quick filter shows, in order.
 */
const titlesAsked = (
  titles: readonly ListedTitle[],
  query: TitleListQuery,
  now: number,
): { counts: TitleCounts; shown: ListedTitle[] } => {
  const searched = narrowed(titles, query, now);

  return {
    counts: {
      all: searched.length,
      look: searched.filter((title) => isShown(title, 'look')).length,
      twice: searched.filter((title) => isShown(title, 'twice')).length,
      unreadable: searched.filter((title) => isShown(title, 'unreadable')).length,
      edited: searched.filter((title) => isShown(title, 'edited')).length,
    },
    shown: ordered(
      searched.filter((title) => isShown(title, query.show)),
      query,
    ),
  };
};

export { titlesAsked };
