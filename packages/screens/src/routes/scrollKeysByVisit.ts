import { z } from 'zod';
import { scrollKeyOf } from '@ValenceScreens/routes/scrollKeyOf';

type Visited = {
  pathname: string;
  searchStr: string;
  state: { __TSR_key?: string; key?: string; __TSR_index?: number };
};

type Entry = { entry: string; page: string; visit: string };

const STORAGE_KEY = 'valence-scroll-visits';

const MOST_KEPT = 200;

const KeptSchema = z.array(z.tuple([z.string(), z.string()]));

/**
 * Reads which history entries joined another entry's visit, as this tab last kept them, so a reload
 * still finds the position saved for that visit.
 *
 * @returns Each entry's visit, by entry.
 */
const readKept = (): Map<string, string> => {
  try {
    const held = window.sessionStorage.getItem(STORAGE_KEY);

    return held === null
      ? new Map<string, string>()
      : new Map<string, string>(KeptSchema.parse(JSON.parse(held)));
  } catch {
    return new Map<string, string>();
  }
};

/**
 * Keeps which history entries joined another entry's visit for the rest of this tab's life, the most
 * recent few hundred.
 *
 * @param kept - Each entry's visit, by entry.
 */
const keep = (kept: ReadonlyMap<string, string>): void => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...kept].slice(-MOST_KEPT)));
  } catch {
    return;
  }
};

/**
 * Makes the router's key for remembered scroll positions, one per visit to a page rather than one per
 * page, so arriving at a page by a link starts it at the top as a browser does, while going back or
 * forward to a visit puts it back where it was left. A history entry pushed over the same page, such
 * as a dialog, joins the visit of the entry it was pushed from, so the page keeps its place, and that
 * is remembered for the tab so a reload finds it too.
 *
 * @returns The key, told each location the router asks about.
 */
const scrollKeysByVisit = (): ((location: Visited) => string) => {
  const byEntry = new Map<string, Entry>();
  const byIndex = new Map<number, Entry>();
  const kept = readKept();

  return (location) => {
    const page = scrollKeyOf(location);
    const entry = location.state.__TSR_key ?? location.state.key ?? page;
    const index = location.state.__TSR_index ?? 0;
    const known = byEntry.get(entry)?.visit ?? kept.get(entry);
    const beneath = byIndex.get(index - 1);
    const joined =
      beneath !== undefined && beneath.entry !== entry && beneath.page === page
        ? beneath.visit
        : undefined;
    const visit = known ?? joined ?? entry;
    const held = { entry, page, visit };

    byEntry.set(entry, held);
    byIndex.set(index, held);

    if (visit !== entry && !kept.has(entry)) {
      kept.set(entry, visit);
      keep(kept);
    }

    return `${page}#${visit}`;
  };
};

export { scrollKeysByVisit };
