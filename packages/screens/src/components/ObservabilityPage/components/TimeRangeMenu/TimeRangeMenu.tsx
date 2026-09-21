import { ChevronDown as ChevronDownIcon, Clock as ClockIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { defaultLogView } from '@ValenceClient/admin/defaultLogView';
import { LOG_RANGES } from '@ValenceClient/admin/logRanges';
import type { TimeRangeMenuProps } from './TimeRangeMenu.types';

/**
 * The stretch of time the page is looking at, chosen from the same menu wherever it is asked for.
 *
 * It is one choice for the whole page, held in the address: choosing "everything kept" on the jobs
 * means the same on the log and on the health, rather than each view forgetting what the others were
 * told. Dragging across the log's graph narrows it to a stretch inside the range, and the menu says
 * so, and choosing a range takes that zoom off again.
 *
 * @param search - What the address says.
 * @param onSearchChange - Told each change, to write into the address.
 */
const TimeRangeMenu = ({ search, onSearchChange }: TimeRangeMenuProps) => {
  const start = defaultLogView().range;
  const isZoomed = search.from !== undefined && search.until !== undefined;
  const range = search.range ?? start;

  return (
    <OptionMenu
      label="Time range"
      triggerShape="field"
      className="w-auto"
      groups={[
        {
          name: 'Time range',
          selectedId: isZoomed ? '' : range,
          onSelect: (id) => {
            const found = LOG_RANGES.find((one) => one.id === id);

            if (found !== undefined) {
              onSearchChange({
                range: found.id === start ? undefined : found.id,
                from: undefined,
                until: undefined,
              });
            }
          },
          options: LOG_RANGES.map((one) => ({ id: one.id, label: one.label })),
        },
      ]}
      trigger={
        <>
          <Icon of={ClockIcon} size={15} className="shrink-0" />
          <span className="truncate">
            {isZoomed ? 'Zoomed in' : (LOG_RANGES.find((one) => one.id === range)?.label ?? 'Time')}
          </span>
          <Icon of={ChevronDownIcon} size={14} className="shrink-0" />
        </>
      }
    />
  );
};

TimeRangeMenu.displayName = 'TimeRangeMenu';

export { TimeRangeMenu };
