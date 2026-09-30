import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { CARD_HOVER, CARD_PRESS } from '@ValenceUI/animations/motion';
import { revealTransition } from '@ValenceUI/animations/reveal';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { cn } from '@ValenceUI/cn';
import type { StudiosRailProps } from './StudiosRail.types';

const TILE = [
  'flex h-24 w-full items-center justify-center rounded-lg px-6',
  'bg-plate ring-1 ring-line shadow-[var(--shadow-artwork)]',
  'transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out)]',
  'motion-reduce:transition-none hover-hover:group-hover/studio:shadow-[var(--shadow-artwork-raised)]',
].join(' ');

const MARK = [
  'max-h-12 w-auto max-w-full object-contain',
  'transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]',
  'motion-reduce:transition-none hover-hover:group-hover/studio:scale-[1.04]',
].join(' ');

/**
 * The studios, drawn as their marks rather than their names, so the row is read the way a shelf of
 * logos is. Each mark is shown in its own colours on a white tile, since most are drawn in dark ink
 * that would vanish on a dark one. The tiles lift, shadow and press exactly as the title cards beside
 * them do.
 * Choosing one shows everything of theirs the catalogue lists.
 *
 * @param studios - The studios to show.
 * @param onOpen - Told which studio was chosen.
 */
const StudiosRail = ({ studios, onOpen }: StudiosRailProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <Rail title="Studios" cards="wide" sizesCards>
      {studios.map((studio, at) => (
        <RevealItem key={studio.id} index={at} className="shrink-0 snap-start">
          <motion.div
            className="group/studio"
            {...(isStill ? {} : { whileHover: CARD_HOVER, whileTap: CARD_PRESS })}
            transition={revealTransition(isStill)}
          >
            <Button
              variant="bare"
              size="none"
              label={studio.name}
              hasTooltip={false}
              onClick={() => {
                onOpen(studio.id);
              }}
              className={cn('w-full', TILE)}
            >
              {studio.logoUrl === null ? (
                <span className="text-sm font-semibold text-on-white">{studio.name}</span>
              ) : (
                <img src={studio.logoUrl} alt={studio.name} loading="lazy" className={MARK} />
              )}
            </Button>
          </motion.div>
        </RevealItem>
      ))}
    </Rail>
  );
};

StudiosRail.displayName = 'StudiosRail';

export { StudiosRail };
