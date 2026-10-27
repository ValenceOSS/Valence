import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown as ChevronDownIcon, ListFilter as ListFilterIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { FilterSplit } from '@ValenceUI/FilterSplit';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { filterMenuGroupOf } from '@ValenceUI/filterMenuGroupOf';
import type { FilterBarProps } from './FilterBar.types';
import { say } from '@ValenceI18n/say';

const ROOM_TO_SPARE_PX = 48;

/**
 * Filters as a row of joined choices where the row fits, and otherwise as one choice that lists the
 * kinds and opens each in turn, unfolding again only once there is room to spare.
 *
 * @param label - What is being filtered, read out to anybody who cannot see the row.
 * @param groups - The kinds of filter, each with its choices.
 * @param selected - Every choice in force, across every kind.
 * @param onChange - Told every choice in force once one changes.
 * @param className - Where it sits.
 */
const FilterBar = ({ label, groups, selected, onChange, className }: FilterBarProps) => {
  const room = useRef<HTMLDivElement>(null);
  const whole = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const roomFor = room.current;
    const row = whole.current;

    if (roomFor === null || row === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const measure = () => {
      setFits((was) =>
        was
          ? row.scrollWidth <= roomFor.clientWidth
          : row.scrollWidth + ROOM_TO_SPARE_PX <= roomFor.clientWidth,
      );
    };
    const watcher = new ResizeObserver(measure);

    watcher.observe(roomFor);
    watcher.observe(row);
    measure();

    return () => {
      watcher.disconnect();
    };
  }, []);

  return (
    <div ref={room} className={cn('relative min-w-0', className)}>
      <div aria-hidden inert className="pointer-events-none absolute inset-0 overflow-hidden">
        <div ref={whole} className="invisible w-max">
          <FilterSplit label={label} groups={groups} selected={selected} onChange={onChange} />
        </div>
      </div>

      {fits ? (
        <FilterSplit label={label} groups={groups} selected={selected} onChange={onChange} />
      ) : (
        <div role="group" aria-label={label} className={JOINED_LOOKS.track}>
          <OptionMenu
            label={label}
            triggerShape="segment"
            align="start"
            drillsIn
            groups={groups.map((group) => filterMenuGroupOf(group, selected, onChange))}
            trigger={
              <>
                <Icon of={ListFilterIcon} size={16} />
                <span className="whitespace-nowrap">{say('common.filters')}</span>
                {selected.size === 0 ? null : (
                  <Badge tone="bright" size="sm">
                    {selected.size}
                  </Badge>
                )}
                <Icon of={ChevronDownIcon} size={14} tone="muted" className="shrink-0" />
              </>
            }
          />
        </div>
      )}
    </div>
  );
};

FilterBar.displayName = 'FilterBar';

export { FilterBar };
