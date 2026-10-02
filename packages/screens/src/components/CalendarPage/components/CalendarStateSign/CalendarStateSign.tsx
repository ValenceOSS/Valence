import {
  CircleArrowDown as DownloadingIcon,
  CircleCheck as AvailableIcon,
  CircleDashed as NotHeldIcon,
  Clock as NotOutYetIcon,
  Search as WantedIcon,
} from '@keyline-icons/react/fill';
import { describeCalendarState } from '@ValenceClient/calendar/describeCalendarState';
import { Icon } from '@ValenceUI/Icon';
import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { CalendarState } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarStateSignProps } from './CalendarStateSign.types';

const LOOK_OF_STATE = {
  available: { of: AvailableIcon, ink: 'text-success' },
  downloading: { of: DownloadingIcon, ink: 'text-busy' },
  wanted: { of: WantedIcon, ink: 'text-highlight' },
  notOutYet: { of: NotOutYetIcon, ink: 'text-text-muted' },
  notHeld: { of: NotHeldIcon, ink: 'text-text-muted' },
} as const satisfies Record<CalendarState, { of: IconGlyph; ink: string }>;

/**
 * Where something on the release calendar has got to, as a small sign where there is no room to
 * say it: a tick once it is in the library, an arrow while it downloads, a magnifier while it is
 * being looked for, a clock until it is out, and a broken ring where it is out but nobody has it.
 * The words show when the pointer rests on it, and are there for a screen reader.
 *
 * @param state - Where it is.
 */
const CalendarStateSign = ({ state }: CalendarStateSignProps) => {
  const look = LOOK_OF_STATE[state];
  const { label } = describeCalendarState(state);

  return (
    <Tooltip label={label}>
      <span className={cn('flex shrink-0 items-center', look.ink)}>
        <Icon of={look.of} size={14} />
        <span className="sr-only">{label}</span>
      </span>
    </Tooltip>
  );
};

CalendarStateSign.displayName = 'CalendarStateSign';

export { CalendarStateSign };
