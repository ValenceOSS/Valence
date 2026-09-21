import { parseLogSearch } from '@ValenceClient/admin/parseLogSearch';
import type { LogView } from '@ValenceClient/admin/logView.types';

/**
 * Turns the fields in what was typed into filters once a word is finished.
 *
 * A word is finished when it is followed by a space, so that `job:abc123 ` becomes a filter chip and
 * the box is left for whatever is typed next, while `job:abc1` — which might still be an id in the
 * making — is left alone and searched for as text. Filters already on are kept: a level typed in
 * adds to the levels shown rather than replacing them, and an identifier replaces the same kind of
 * identifier.
 *
 * @param typed - The contents of the search box.
 * @param view - What the explorer is showing.
 * @returns What the box should now hold, and the view with the filters that were typed.
 */
const applyTypedSearch = (typed: string, view: LogView): { typed: string; view: LogView } => {
  if (!/\s$/.test(typed)) {
    return { typed, view };
  }

  const parsed = parseLogSearch(typed);
  const isNarrowing =
    parsed.levels.length + parsed.sources.length + parsed.jobKinds.length > 0 ||
    Object.keys(parsed.ids).length > 0;

  if (!isNarrowing) {
    return { typed, view };
  }

  return {
    typed: parsed.text === '' ? '' : `${parsed.text} `,
    view: {
      ...view,
      levels: parsed.levels.length === 0 ? view.levels : parsed.levels,
      sources: [...new Set([...view.sources, ...parsed.sources])],
      jobKinds: [...new Set([...view.jobKinds, ...parsed.jobKinds])],
      ids: { ...view.ids, ...parsed.ids },
    },
  };
};

export { applyTypedSearch };
