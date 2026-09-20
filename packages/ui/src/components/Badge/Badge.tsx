import { cn } from '@ValenceUI/cn';
import { Spinner } from '@ValenceUI/Spinner';
import { inkOn } from './inkOn';
import type { BadgeProps, BadgeSize, BadgeTone } from './Badge.types';

const TONE_CLASSES: Record<BadgeTone, string> = {
  quiet: 'border border-line bg-muted text-text-muted',
  accent: 'bg-accent text-accent-contrast',
  success: 'bg-success text-surface',
  highlight: 'bg-highlight text-highlight-contrast',
  solid: 'bg-shade text-on-scrim',
  busy: 'bg-busy text-surface',
  waiting: 'bg-busy text-surface',
  warning: 'bg-highlight text-highlight-contrast',
  danger: 'bg-danger text-surface',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-6 px-2.5 text-[0.65rem]',
  md: 'h-7 px-3 text-xs',
};

/**
 * States one small fact beside the thing it is about — a count, a status, a format. Sized to sit
 * inline without disturbing the line it is on, and toned so that the ordinary case is quiet and
 * only a warning or a failure asks for attention.
 *
 * Whatever is waiting is the colour of what is in progress, since it is about to be, and only what
 * is actually in progress carries a spinner after its words, so a status that is still changing does not read the
 * same as one that has settled.
 *
 * Every tone is a solid fill rather than glass. A status is read at a glance down a column, and a
 * tint over whatever happens to be behind it reads differently on every row it sits on.
 *
 * @param children - The fact, in as few words as it can be said.
 * @param tone - How much attention it should draw, defaulting to none.
 * @param colour - A colour of its own, for a badge whose colour is the thing it says, such as a role
 *   somebody chose one for. It replaces the tone, and the words are set in whichever ink reads on it.
 * @param size - Whether it sits inline with text or stands slightly apart.
 * @param className - Extra classes for the caller's own layout.
 */
const Badge = ({ children, tone = 'quiet', colour = null, size = 'sm', className }: BadgeProps) => (
  <span
    {...(colour === null ? {} : { style: { backgroundColor: colour, color: inkOn(colour) } })}
    className={cn(
      'inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-md font-semibold',
      'uppercase tracking-[0.12em] indent-[0.12em] leading-none whitespace-nowrap',
      colour === null ? TONE_CLASSES[tone] : '',
      SIZE_CLASSES[size],
      className,
    )}
  >
    {children}
    {colour === null && tone === 'busy' ? <Spinner size="xs" label="In progress" /> : null}
  </span>
);

Badge.displayName = 'Badge';

export { Badge };
