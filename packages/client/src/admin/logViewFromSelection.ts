import { parseLogSearch } from './parseLogSearch';
import type { LogView } from './logView.types';

/**
 * A view with its filters replaced by the ones named, as a menu or a row of chips hands them back.
 * What the view is looking at in time, its search, order and length are left as they were.
 *
 * @param view - What the explorer was showing.
 * @param selected - The names of the filters that should now be on.
 * @returns The view with those filters.
 */
const logViewFromSelection = (view: LogView, selected: ReadonlySet<string>): LogView => {
  const parsed = parseLogSearch([...selected].join(' '));

  return {
    ...view,
    levels: parsed.levels,
    sources: parsed.sources,
    jobKinds: parsed.jobKinds,
    ids: parsed.ids,
  };
};

export { logViewFromSelection };
