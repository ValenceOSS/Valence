import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import { defaultLogView } from './defaultLogView';
import { parseLogSearch } from './parseLogSearch';
import type { LogView } from './logView.types';
import type { ObservabilitySearch } from './ObservabilitySearchSchema';

/**
 * Reads what the log is showing back out of the address: the filters and the words to look for from
 * `q`, the time range, the zoom and the order. Whatever the address does not say is the log's own
 * default, so an address with nothing in it is the log as it opens.
 *
 * @param search - What the address carries.
 * @returns The view, and the words the search box should hold.
 */
const logViewFromSearch = (search: ObservabilitySearch): { view: LogView; text: string } => {
  const parsed = parseLogSearch(search.q ?? '');
  const start = defaultLogView();
  const isZoomed = search.from !== undefined && search.until !== undefined;

  return {
    view: {
      ...start,
      range: search.range ?? start.range,
      zoom:
        isZoomed && search.from !== undefined && search.until !== undefined
          ? { fromMs: search.from, untilMs: search.until }
          : null,
      levels:
        parsed.levels.length === 0
          ? [...LOG_LEVELS]
          : LOG_LEVELS.filter((level) => parsed.levels.includes(level)),
      sources: parsed.sources,
      jobKinds: parsed.jobKinds,
      ids: parsed.ids,
      sort: search.sort ?? start.sort,
    },
    text: parsed.text,
  };
};

export { logViewFromSearch };
