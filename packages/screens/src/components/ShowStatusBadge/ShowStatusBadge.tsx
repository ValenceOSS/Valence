import {
  Calendar as CalendarIcon,
  CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon,
  Clock as ClockIcon,
  RefreshCw as RefreshCwIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { ShowStatusBadgeProps } from './ShowStatusBadge.types';

const LOOKS: Readonly<Record<string, { label: string; tone: BadgeTone; icon: IconGlyph }>> = {
  'returning series': {
    label: say('screens.showStatusBadge.returning'),
    tone: 'success',
    icon: RefreshCwIcon,
  },
  'in production': {
    label: say('screens.showStatusBadge.inProduction'),
    tone: 'busy',
    icon: ClockIcon,
  },
  planned: { label: say('screens.showStatusBadge.planned'), tone: 'accent', icon: CalendarIcon },
  pilot: { label: say('screens.showStatusBadge.pilot'), tone: 'accent', icon: CalendarIcon },
  ended: { label: say('screens.showStatusBadge.ended'), tone: 'quiet', icon: CircleCheckIcon },
  canceled: { label: say('screens.showStatusBadge.cancelled'), tone: 'danger', icon: CircleXIcon },
  cancelled: { label: say('screens.showStatusBadge.cancelled'), tone: 'danger', icon: CircleXIcon },
};

/**
 * Where a show stands — coming back, finished, cancelled — as words and a sign in the colour the
 * rest of Valence gives the same kind of news, on a backing dark enough to read over artwork. A
 * status the catalogue invents that has no look of its own is shown as the catalogue words it.
 *
 * @param status - The status as the catalogue words it, such as "Returning Series".
 * @param className - Extra classes for the caller's own layout.
 */
const ShowStatusBadge = ({ status, className }: ShowStatusBadgeProps) => {
  const look = LOOKS[status.trim().toLowerCase()];

  return (
    <Badge
      size="sm"
      tone={look?.tone ?? 'quiet'}
      {...(look === undefined ? {} : { icon: look.icon })}
      className={cn(
        'bg-shade/60 backdrop-blur-md',
        look?.tone === 'quiet' || look === undefined ? 'text-on-scrim/90' : '',
        className,
      )}
    >
      {look?.label ?? status}
    </Badge>
  );
};

ShowStatusBadge.displayName = 'ShowStatusBadge';

export { ShowStatusBadge };
