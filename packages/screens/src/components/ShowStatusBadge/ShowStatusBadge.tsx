import {
  Calendar as CalendarIcon,
  CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon,
  Clock as ClockIcon,
  RefreshCw as RefreshCwIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { describeShowStatus } from '@ValenceClient/library/describeShowStatus';
import type { ShowStatusKind } from '@ValenceClient/library/describeShowStatus';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { ShowStatusBadgeProps } from './ShowStatusBadge.types';

const ICONS: Readonly<Record<ShowStatusKind, IconGlyph>> = {
  returning: RefreshCwIcon,
  production: ClockIcon,
  planned: CalendarIcon,
  ended: CircleCheckIcon,
  cancelled: CircleXIcon,
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
  const look = describeShowStatus(status);

  return (
    <Badge
      size="sm"
      tone={look?.tone ?? 'quiet'}
      {...(look === null ? {} : { icon: ICONS[look.kind] })}
      className={cn(
        'bg-shade/60 backdrop-blur-md',
        look?.tone === 'quiet' || look === null ? 'text-on-scrim/90' : '',
        className,
      )}
    >
      {look?.label ?? status}
    </Badge>
  );
};

ShowStatusBadge.displayName = 'ShowStatusBadge';

export { ShowStatusBadge };
