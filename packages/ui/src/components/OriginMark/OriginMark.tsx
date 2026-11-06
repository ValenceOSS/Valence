import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import type { OriginMarkProps } from './OriginMark.types';

/**
 * Which other server something comes from, drawn as that server's picture, or its initial in its
 * colour where it has none, and named on hover — small enough to sit in a corner of a poster or a
 * cover without hiding it.
 *
 * @param initial - The server's initial.
 * @param colour - The server's colour.
 * @param ink - Whether dark or light writing reads on that colour.
 * @param label - What the mark says, read out and shown on hover.
 * @param pictureUrl - Where the server's picture is read from, where it has one.
 * @param className - Extra classes for the caller's own layout.
 */
const OriginMark = ({
  initial,
  colour,
  ink,
  label,
  pictureUrl = null,
  className,
}: OriginMarkProps) => (
  <Tooltip label={label}>
    <span
      role="img"
      aria-label={label}
      style={{ backgroundColor: colour }}
      className={cn(
        'flex size-6 items-center justify-center overflow-hidden rounded-full text-[0.7rem] font-semibold shadow-sm ring-2 ring-shade',
        ink === 'dark' ? 'text-letter-dark' : 'text-letter-light',
        className,
      )}
    >
      {pictureUrl === null ? (
        initial
      ) : (
        <img src={pictureUrl} alt="" className="size-full object-cover" />
      )}
    </span>
  </Tooltip>
);

OriginMark.displayName = 'OriginMark';

export { OriginMark };
