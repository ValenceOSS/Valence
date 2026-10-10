import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { LOG_RANGES } from '@ValenceClient/admin/logRanges';
import { say } from '@ValenceI18n/say';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { ScopedChoice } from '@ValenceUI/ScopedField.types';

const ZOOMED = 'zoomed';

/**
 * The window of time a page of the observability area looks over, as a choice at the end of its
 * search: one of the usual spans, or — once somebody has dragged across a chart — the stretch they
 * chose, which picking a span leaves.
 *
 * @param search - What the address says is being looked at.
 * @param onSearchChange - Told the span chosen.
 * @returns The choice.
 */
const timeRangeChoice = (
  search: ObservabilitySearch,
  onSearchChange: (change: ObservabilitySearch) => void,
): ScopedChoice => {
  const start = defaultLogView().range;
  const isZoomed = search.from !== undefined && search.until !== undefined;

  return {
    label: say('screens.observabilityPage.timeRangeMenu.timeRange'),
    options: [
      ...(isZoomed
        ? [{ id: ZOOMED, label: say('screens.observabilityPage.timeRangeMenu.zoomedIn') }]
        : []),
      ...LOG_RANGES.map((one) => ({ id: one.id, label: one.label })),
    ],
    value: isZoomed ? ZOOMED : (search.range ?? start),
    onChange: (id) => {
      const found = LOG_RANGES.find((one) => one.id === id);

      if (found !== undefined) {
        onSearchChange({
          range: found.id === start ? undefined : found.id,
          from: undefined,
          until: undefined,
        });
      }
    },
  };
};

export { timeRangeChoice };
