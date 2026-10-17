import {
  Bug as BugIcon,
  CircleX as CircleXIcon,
  Info as InfoIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { LogLevel } from '@ValenceContracts/schemas/Log';
import type { LogLevelBadgeProps } from './LogLevelBadge.types';
import { say } from '@ValenceI18n/say';

const LOOKS: Record<LogLevel, { label: string; tone: BadgeTone; icon: IconGlyph }> = {
  debug: { label: say('screens.admin.describeLogLevel.debug'), tone: 'quiet', icon: BugIcon },
  info: { label: say('screens.admin.describeLogLevel.info'), tone: 'quiet', icon: InfoIcon },
  warn: {
    label: say('screens.adminArea.announcementCard.warning'),
    tone: 'warning',
    icon: TriangleAlertIcon,
  },
  error: { label: say('screens.logLevelBadge.error'), tone: 'danger', icon: CircleXIcon },
};

/**
 * How serious one log record is, as a badge with the level in words and its own mark beside them,
 * so a row of them reads the same way as every other status badge in the admin area.
 *
 * @param level - How serious the record is.
 * @param className - Extra classes for the caller's own layout.
 */
const LogLevelBadge = ({ level, className }: LogLevelBadgeProps) => {
  const look = LOOKS[level];

  return (
    <Badge
      size="sm"
      tone={look.tone}
      icon={look.icon}
      {...(className === undefined ? {} : { className })}
    >
      {look.label}
    </Badge>
  );
};

LogLevelBadge.displayName = 'LogLevelBadge';

export { LogLevelBadge };
