import { cn } from '@ValenceUI/cn';
import {
  CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon,
  Clock as ClockIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { Spinner } from '@ValenceUI/Spinner';
import { inkOn } from './inkOn';
import type { BadgeProps, BadgeSize, BadgeTone } from './Badge.types';
import { say } from '@ValenceI18n/say';

const TONE_CLASSES: Record<BadgeTone, string> = {
  quiet: 'bg-[var(--surface-hover)] text-text-muted',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  highlight: 'bg-highlight/15 text-highlight',
  solid: 'bg-overlay text-on-scrim',
  bright: 'bg-text text-surface',
  busy: 'bg-busy/15 text-busy',
  waiting: 'bg-busy/15 text-busy',
  warning: 'bg-highlight/15 text-highlight',
  danger: 'bg-danger/15 text-danger',
  outline: 'border border-current/60 bg-transparent text-current',
};

const TONE_ICONS: Partial<Record<BadgeTone, IconGlyph>> = {
  success: CircleCheckIcon,
  waiting: ClockIcon,
  warning: TriangleAlertIcon,
  danger: CircleXIcon,
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-6 gap-1 px-2 text-xs',
  md: 'h-7 gap-1.5 px-2.5 text-[0.8125rem]',
};

/**
 * States one small fact beside the thing it is about — a count, a status, a format. Sized to sit
 * inline without disturbing the line it is on, and toned so that the ordinary case is quiet and
 * only a warning or a failure asks for attention.
 *
 * A status says itself twice: in its colour, and in a solid mark after its words — a tick for done,
 * a clock for waiting, a cross for failed — so it still reads for somebody who does not see the
 * colour. Whatever is in progress carries a spinner instead, so a status that is still changing does
 * not read the same as one that has settled.
 *
 * @param children - The fact, in as few words as it can be said.
 * @param tone - How much attention it should draw, defaulting to none.
 * @param colour - A colour of its own, for a badge whose colour is the thing it says, such as a role
 *   somebody chose one for. It replaces the tone, and the words are set in whichever ink reads on it.
 * @param icon - A mark of its own after the words, in place of the one its tone carries.
 * @param size - Whether it sits inline with text or stands slightly apart.
 * @param className - Extra classes for the caller's own layout.
 */
const Badge = ({
  children,
  tone = 'quiet',
  colour = null,
  icon,
  size = 'sm',
  className,
}: BadgeProps) => {
  const mark = icon ?? (colour === null ? TONE_ICONS[tone] : undefined);

  return (
    <span
      {...(colour === null ? {} : { style: { backgroundColor: colour, color: inkOn(colour) } })}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-md font-medium',
        'leading-none whitespace-nowrap',
        colour === null ? TONE_CLASSES[tone] : '',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
      {colour === null && tone === 'busy' ? (
        <Spinner size="xs" label={say('common.inProgress')} />
      ) : mark === undefined ? null : (
        <Icon of={mark} size={size === 'sm' ? 13 : 14} />
      )}
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge };
