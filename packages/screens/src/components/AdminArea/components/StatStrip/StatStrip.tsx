import { Info as InfoIcon } from '@keyline-icons/react';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { StatTile } from '@ValenceUI/StatTile';
import type { StatStripProps } from './StatStrip.types';

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
const StatStrip = ({ stats }: StatStripProps) => (
  <dl className={`grid grid-cols-2 gap-3 ${COLUMN_CLASSES[stats.length] ?? 'lg:grid-cols-4'}`}>
    {stats.map((stat) => (
      <StatTile
        key={stat.label}
        label={stat.label}
        value={stat.value}
        {...(stat.detail === undefined ? {} : { detail: stat.detail })}
        {...(stat.fraction === undefined ? {} : { fraction: stat.fraction })}
        {...(stat.info === undefined
          ? {}
          : {
              icon: (
                <HoverCard side="bottom" align="start" detail={stat.info}>
                  <span className="text-text-muted hover:text-text">
                    <Icon of={InfoIcon} size={14} label={`About ${stat.label}`} />
                  </span>
                </HoverCard>
              ),
            })}
      />
    ))}
  </dl>
);

StatStrip.displayName = 'StatStrip';

export { StatStrip };
