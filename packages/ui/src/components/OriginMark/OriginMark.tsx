import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import type { OriginMarkProps } from './OriginMark.types';

/**
 * Which other server something comes from, drawn as that server's initial in its colour and named
 * on hover — small enough to sit in a corner of a poster or a cover without hiding it.
 *
 * @param initial - The server's initial.
 * @param colour - The server's colour.
 * @param ink - Whether dark or light writing reads on that colour.
 * @param label - What the mark says, read out and shown on hover.
 * @param className - Extra classes for the caller's own layout.
 */
const OriginMark = ({ initial, colour, ink, label, className }: OriginMarkProps) => (
  <Tooltip label={label}>
    <span
      role="img"
      aria-label={label}
      style={{ backgroundColor: colour }}
      className={cn(
        'flex size-6 items-center justify-center rounded-full text-[0.7rem] font-semibold shadow-sm ring-2 ring-shade/40',
        ink === 'dark' ? 'text-letter-dark' : 'text-letter-light',
        className,
      )}
    >
      {initial}
    </span>
  </Tooltip>
);

OriginMark.displayName = 'OriginMark';

export { OriginMark };
