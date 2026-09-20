import { motion } from 'motion/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { usePagedScroller } from '@ValenceUI/usePagedScroller';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { RailProps } from './Rail.types';

const TOKENS = ['[--rail-gap:1rem] [--rail-peek:0rem]', RAIL.lane].join(' ');

const PER = {
  wide: '[--rail-per:2] sm:[--rail-per:2] md:[--rail-per:3] lg:[--rail-per:4] xl:[--rail-per:5]',
  portrait:
    '[--rail-per:2] sm:[--rail-per:2] md:[--rail-per:3] lg:[--rail-per:4] xl:[--rail-per:5]',
} as const;

const FITTED = [
  '[&>*]:w-[calc((100%-var(--rail-peek)-(var(--rail-per)-1)*var(--rail-gap))/var(--rail-per))]',
  '[&>*]:shrink-0 [&>*]:snap-start',
].join(' ');

const LANE = 'px-[var(--rail-lane)] scroll-px-[var(--rail-lane)]';

/**
 * One titled row of a library, scrolling sideways rather than wrapping, which is how a shelf is
 * read: along, not down. The title can lead somewhere when there is more than the row shows, and
 * the caller can hang a control off the right of it.
 *
 * As many whole cards as fit, filling the row from one gutter to the other. Nothing is ever cut down
 * the middle: a page turn moves by whole cards — see `usePagedScroller`.
 *
 * The row turns by a pair of arrows in its header, beside whatever the caller hangs there, rather
 * than by controls laid over the cards. Arrows over the artwork had to stand on the hanging card to
 * be reachable, which meant a lane held open for them, a darkened edge, and a card beneath that must
 * not light up; in the header none of that is needed and the cards are only ever cards.
 *
 * The header stands above the row, whose own vertical padding reaches up into it so that a card can lift
 * without being clipped; without that the lower half of an arrow would be the row's and not the arrow's.
 *
 * They turn by whole cards, land on whole cards, and dim at either end rather than disappearing so
 * the header does not shift as the row is turned. The row itself is dragged where there is no
 * hover, and left to the arrows where there is, so a trackpad cannot leave it resting between pages.
 *
 * @param title - What the row holds.
 * @param children - The cards in it.
 * @param count - How many there are, drawn beside the title, where a row wants that said outright
 *   rather than left to be counted.
 * @param action - A control for the right of the title bar, such as a way to see everything.
 * @param onOpenTitle - Told when the title was pressed, where the row leads somewhere fuller.
 * @param hasArrows - Whether the row is laid out in step with the page's gutters. A row inside a dialog
 *   sits within the dialog's own padding, and holding a page's gutter open there reads as a stray margin.
 * @param className - Extra classes for the caller's own layout.
 */
const Rail = ({
  title,
  children,
  count,
  action,
  onOpenTitle,
  sizesCards = false,
  cards = 'wide',
  hasArrows = true,
  className,
}: RailProps) => {
  const { trackRef, pages, isAtStart, isAtEnd, measure, scrollTo } =
    usePagedScroller<HTMLUListElement>([children]);

  const hasPages = pages.count > 1;

  return (
    <section
      className={cn(
        'group/rail flex flex-col gap-3',
        sizesCards ? cn(TOKENS, PER[cards]) : '',
        className,
      )}
      aria-label={title}
    >
      <header
        className={cn(
          'relative z-10 flex items-end justify-between gap-4',
          sizesCards ? (hasArrows ? 'px-[var(--rail-lane)]' : 'pr-2') : 'px-1',
        )}
      >
        <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-text">
          {onOpenTitle === undefined ? (
            title
          ) : (
            <Button variant="link" size="none" onClick={onOpenTitle} className="text-left">
              {title}
            </Button>
          )}

          {count === undefined ? null : (
            <>
              {' '}
              <span className="text-sm font-normal tabular-nums text-text-muted/70">{count}</span>
            </>
          )}
        </h2>

        <div className="flex items-center gap-2">
          {action}

          {!hasPages ? null : (
            <>
              <Button
                variant="glossy"
                size="xs"
                isIconOnly
                label={`Back a page of ${title}`}
                hasTooltip={false}
                disabled={isAtStart}
                onClick={() => {
                  scrollTo(pages.at - 1);
                }}
              >
                <Icon of={ArrowLeft01Icon} size={16} />
              </Button>

              <Button
                variant="glossy"
                size="xs"
                isIconOnly
                label={`Forward a page of ${title}`}
                hasTooltip={false}
                disabled={isAtEnd}
                onClick={() => {
                  scrollTo(pages.at + 1);
                }}
              >
                <Icon of={ArrowRight01Icon} size={16} />
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="relative">
        <motion.ul
          ref={trackRef}
          onScroll={measure}
          variants={groupVariants}
          initial="hidden"
          animate="shown"
          className={cn(
            'valence-rail -my-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-6',
            'hover-hover:overflow-x-hidden',
            sizesCards ? cn(FITTED, hasArrows ? LANE : '') : 'scroll-p-1 px-1',
          )}
        >
          {children}
        </motion.ul>
      </div>
    </section>
  );
};

Rail.displayName = 'Rail';

export { Rail };
