import { motion } from 'motion/react';
import { fadeVariants, stillTransition } from '@ValenceUI/animations/reveal';
import { Info as InfoIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { StatTile } from '@ValenceUI/StatTile';
import type { StatStripProps } from './StatStrip.types';
import { say } from '@ValenceI18n/say';

const COLUMN_CLASSES: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

/**
 * The figures that stay on screen whatever else is being read, each with what it measures and, where
 * it is a proportion, a bar of how full it is. A figure that is really a summary of several others
 * carries an information mark, opening onto the detail rather than crowding it onto the tile itself.
 *
 * Fills one row rather than wrapping a lone figure onto a second, so a caller showing fewer figures
 * — a page that is not the overview, say — reads as a row meant to be that width rather than a grid
 * with a gap in it.
 *
 * @param stats - The figures to show, in the order they should read.
 */
const StatStrip = ({ stats }: StatStripProps) => {
  return (
    <div className={`grid grid-cols-2 gap-3 ${COLUMN_CLASSES[stats.length] ?? 'lg:grid-cols-4'}`}>
      {stats.map((stat) => (
        <motion.dl
          key={stat.label}
          variants={fadeVariants}
          initial="hidden"
          animate="shown"
          transition={stillTransition}
          className="min-w-0"
        >
          <StatTile
            label={stat.label}
            value={stat.value}
            {...(stat.detail === undefined ? {} : { detail: stat.detail })}
            {...(stat.fraction === undefined ? {} : { fraction: stat.fraction })}
            {...(stat.info === undefined
              ? {}
              : {
                  icon: (
                    <HoverCard side="bottom" align="end" isList detail={stat.info}>
                      <Button
                        variant="ghost"
                        size="xs"
                        isIconOnly
                        label={say('screens.adminArea.statStrip.aboutLabel', { label: stat.label })}
                        hasTooltip={false}
                      >
                        <Icon of={InfoIcon} size={15} />
                      </Button>
                    </HoverCard>
                  ),
                })}
          />
        </motion.dl>
      ))}
    </div>
  );
};

StatStrip.displayName = 'StatStrip';

export { StatStrip };
