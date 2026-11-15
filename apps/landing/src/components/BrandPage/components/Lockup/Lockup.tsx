import { cn } from '@ValenceUI/cn';
import { Logo } from '@ValenceUI/Logo';
import type { LockupProps } from './Lockup.types';

/**
 * The mark and the name set together by the brand's one rule: the mark stands on the baseline and
 * stops at the top of the V, a quarter of the type size from the name, or sits above it when
 * stacked.
 *
 * @param markColour - The colour of the mark.
 * @param wordColour - The colour of the name.
 * @param isStacked - Whether the mark sits above the name rather than beside it.
 * @param className - Its size, set as a font size, and where it sits.
 */
const Lockup = ({ markColour, wordColour, isStacked = false, className }: LockupProps) => (
  <span
    className={cn(
      'inline-flex font-[800] leading-none tracking-[-0.045em]',
      isStacked ? 'flex-col items-center gap-[0.35em]' : 'items-baseline gap-[0.25em]',
      className,
    )}
  >
    <span style={{ color: markColour }} className="inline-flex">
      <Logo isCurrentColour className={isStacked ? 'h-[1.6cap]' : 'h-[1cap]'} />
    </span>
    <span style={{ color: wordColour }} className="pe-[0.06em]">
      Valence
    </span>
  </span>
);

Lockup.displayName = 'Lockup';

export { Lockup };
