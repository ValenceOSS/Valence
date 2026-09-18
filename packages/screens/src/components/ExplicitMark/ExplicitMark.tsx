import { cn } from '@ValenceUI/cn';
import type { ExplicitMarkProps } from './ExplicitMark.types';

/**
 * The small E set beside a song or an album whose tags say it is explicit — the mark people already
 * know from every other music app, so it needs no explaining.
 *
 * @param className - Extra classes for the caller's own layout.
 */
const ExplicitMark = ({ className }: ExplicitMarkProps) => (
  <span
    role="img"
    aria-label="Explicit"
    title="Explicit"
    className={cn(
      'inline-flex size-4 shrink-0 items-center justify-center rounded-xs bg-text-muted/80 text-[0.625rem] font-bold leading-none text-surface',
      className,
    )}
  >
    E
  </span>
);

ExplicitMark.displayName = 'ExplicitMark';

export { ExplicitMark };
