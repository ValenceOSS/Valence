import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { VALENCE_TOKENS } from '@ValenceUI/tokens';
import type { HighlightRect } from '@ValenceUI/useSlidingHighlight';
import type { HoverHighlightProps } from './HoverHighlight.types';

const RADIUS_CLASSES = {
  none: 'rounded-none',
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  card: 'rounded-lg',
  nested: 'rounded-lg',
  pill: 'rounded-full',
} as const;

/**
 * Where the highlight sits, moved by a transform rather than by its offsets so that moving it never
 * lays the page out again, with its size alongside.
 *
 * @param rect - Where it should sit.
 * @returns The transform and size to draw it with.
 */
const placeOf = (rect: HighlightRect) => ({
  transform: `translate(${rect.left.toString()}px, ${rect.top.toString()}px)`,
  width: rect.width,
  height: rect.height,
});

/**
 * The single background that follows a pointer down a menu or a table, moving between rows rather
 * than appearing on each in turn. Takes the position measured by whatever owns the rows, since only
 * that knows where they are.
 *
 * @param rect - Where the highlight should sit, or null to show none at all.
 * @param radius - How round its corners are, which should match the rows it moves between.
 */
const HoverHighlight = ({ rect, radius = 'md' }: HoverHighlightProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;

  return (
    <AnimatePresence>
      {rect === null ? null : (
        <motion.span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 start-0 z-0 bg-[var(--surface-hover)]',
            RADIUS_CLASSES[radius],
          )}
          initial={{ opacity: 0, ...placeOf(rect) }}
          animate={{ opacity: 1, ...placeOf(rect) }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: isStill ? 0 : VALENCE_TOKENS.duration.fast },
            default: isStill
              ? { duration: 0 }
              : { duration: VALENCE_TOKENS.duration.normal, ease: VALENCE_TOKENS.ease.soft },
          }}
        />
      )}
    </AnimatePresence>
  );
};

HoverHighlight.displayName = 'HoverHighlight';

export { HoverHighlight };
