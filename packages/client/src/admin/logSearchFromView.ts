import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import { defaultLogView } from './defaultLogView';
import { logViewSelection } from './logViewSelection';
import type { LogView } from './logView.types';
import type { ObservabilitySearch } from './ObservabilitySearchSchema';

/**
 * Writes what the log is showing into the address, in the fewest words: a filter, a range or an
 * order that is the log's own default is left out, so the address of an unnarrowed log is bare.
 *
 * Every field the log has is given, as nothing where it is left out, so that handing this to the
 * address replaces what it said before rather than adding to it.
 *
 * @param view - What the log is showing.
 * @param text - The words in the search box.
 * @returns The fields of the address that belong to the log.
 */
const logSearchFromView = (
  view: LogView,
  text: string,
): Pick<ObservabilitySearch, 'q' | 'range' | 'from' | 'until' | 'sort'> => {
  const start = defaultLogView();
  const isEveryLevel = view.levels.length === LOG_LEVELS.length;
  const filters = [...logViewSelection(view)].filter(
    (id) => !(isEveryLevel && id.startsWith('level:')),
  );
  const q = [...filters, text.trim()].filter((part) => part !== '').join(' ');

  return {
    q: q === '' ? undefined : q,
    range: view.range === start.range ? undefined : view.range,
    from: view.zoom === null ? undefined : view.zoom.fromMs,
    until: view.zoom === null ? undefined : view.zoom.untilMs,
    sort: view.sort === start.sort ? undefined : view.sort,
  };
};

export { logSearchFromView };
