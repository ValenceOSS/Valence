import { scrollKeyOf } from '@ValenceScreens/routes/scrollKeyOf';

type Visited = {
  pathname: string;
  searchStr: string;
  state: { __TSR_key?: string; key?: string; __TSR_index?: number };
};

type Entry = { entry: string; page: string; visit: string };

/**
 * Makes the router's key for remembered scroll positions, one per visit to a page rather than one per
 * page, so arriving at a page by a link starts it at the top as a browser does, while going back or
 * forward to a visit puts it back where it was left. A history entry that only opens something over
 * the page beneath it, such as a dialog, belongs to that page's visit, so the page keeps its place:
 * a new entry joins the visit of the entry it replaced or was pushed from, where that is the same
 * page.
 *
 * @returns The key, told each location the router asks about.
 */
const scrollKeysByVisit = (): ((location: Visited) => string) => {
  const byEntry = new Map<string, Entry>();
  const byIndex = new Map<number, Entry>();

  return (location) => {
    const page = scrollKeyOf(location);
    const entry = location.state.__TSR_key ?? location.state.key ?? page;
    const index = location.state.__TSR_index ?? 0;
    const known = byEntry.get(entry);
    const beneath = [byIndex.get(index), byIndex.get(index - 1)].find(
      (one) => one !== undefined && one.entry !== entry && one.page === page,
    );
    const visit = known?.visit ?? beneath?.visit ?? entry;
    const held = { entry, page, visit };

    byEntry.set(entry, held);
    byIndex.set(index, held);

    return `${page}#${visit}`;
  };
};

export { scrollKeysByVisit };
