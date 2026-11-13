import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { SessionPillProps } from './SessionPill.types';

/**
 * A word set on a session's artwork in a frosted pill, such as whether it is playing or how it is
 * delivered, sized from the card so it reads the same on a small card as on a large one.
 *
 * @param children - The word.
 * @param glyph - A mark drawn before the word, if any.
 * @param side - Which top corner of the artwork it sits in.
 */
const SessionPill = ({ children, glyph, side = 'left' }: SessionPillProps) => (
  <span
    className={cn(
      'absolute z-[2] inline-flex items-center whitespace-nowrap rounded-full bg-shade/45 font-semibold text-on-scrim ring-1 ring-on-scrim/15 ring-inset backdrop-blur-md backdrop-saturate-150',
      'top-[clamp(6px,2.8cqw,14px)] h-[clamp(19px,6.8cqw,28px)] gap-[clamp(4px,1.6cqw,7px)]',
      'px-[clamp(6px,2.4cqw,11px)] text-[clamp(10.5px,3.4cqw,13.5px)]',
      side === 'left' ? 'start-[clamp(8px,3.4cqw,16px)]' : 'end-[clamp(8px,3.4cqw,16px)]',
    )}
  >
    {glyph === undefined ? null : (
      <Icon of={glyph} size={10} className="size-[clamp(8px,2.8cqw,12px)]" />
    )}
    {children}
  </span>
);

SessionPill.displayName = 'SessionPill';

export { SessionPill };
