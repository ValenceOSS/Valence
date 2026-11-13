import { cn } from '@ValenceUI/cn';
import { visibleShares } from './visibleShares';
import type { DotBarProps } from './DotBar.types';

const LEAST_SHARE = 0.05;

/**
 * A bar divided into segments by share, each a block of its own colour, the way a disk is drawn
 * filling up. A part too small to see is drawn wider, at a twentieth of the bar, and
 * the rest narrowed to make room, so every part can be pointed at. One segment can be lit, which brightens and glows while the rest dim, so
 * a legend beside it can point at what it describes. A segment with no colour is drawn as empty room.
 *
 * @param segments - Each part, as a share of the whole and the colour it is drawn in.
 * @param litId - The segment to light, or none.
 * @param label - What the bar shows, read out in place of it.
 * @param onPoint - Told which segment the pointer is over, and null once it leaves.
 * @param className - Extra classes for the caller's own layout.
 */
const DotBar = ({ segments, litId = null, label, onPoint, className }: DotBarProps) => {
  const drawn = visibleShares(
    segments.map((segment) => segment.share),
    LEAST_SHARE,
  );

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex h-12 w-full overflow-hidden rounded-xl', className)}
      onPointerLeave={() => {
        onPoint?.(null);
      }}
    >
      {segments
        .map((segment, at) => ({ ...segment, share: drawn[at] ?? 0 }))
        .filter((segment) => segment.share > 0)
        .map((segment) => {
          const isLit = litId === segment.id;
          const isDim = litId !== null && !isLit;
          const ink = segment.colour;

          return (
            <div
              key={segment.id}
              className={cn(
                'relative h-full min-w-1 border-y border-e first:rounded-s-xl first:border-s last:rounded-e-xl',
                'transition-[opacity,box-shadow,filter] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none',
                isDim ? 'opacity-40' : 'opacity-100',
              )}
              style={{
                flexBasis: `${(segment.share * 100).toString()}%`,
                borderColor: `color-mix(in oklab, ${ink} ${isLit ? '85%' : '50%'}, transparent)`,
                backgroundColor: `color-mix(in oklab, ${ink} ${isLit ? '45%' : '22%'}, transparent)`,
                backgroundImage: `repeating-linear-gradient(135deg, color-mix(in oklab, ${ink} 20%, transparent) 0 2px, transparent 2px 8px)`,
                boxShadow: isLit
                  ? `0 0 28px color-mix(in oklab, ${ink} 45%, transparent), inset 0 0 18px color-mix(in oklab, ${ink} 25%, transparent)`
                  : 'none',
                zIndex: isLit ? 1 : 0,
              }}
              onPointerEnter={() => {
                onPoint?.(segment.id);
              }}
            />
          );
        })}
    </div>
  );
};

DotBar.displayName = 'DotBar';

export { DotBar };
