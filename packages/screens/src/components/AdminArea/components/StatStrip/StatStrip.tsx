import { StatTile } from '@ValenceUI/StatTile';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
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
    <div className={`grid grid-cols-2 gap-4 ${COLUMN_CLASSES[stats.length] ?? 'lg:grid-cols-4'}`}>
      {stats.map((stat) => (
        <StatTile
          key={stat.label}
          label={stat.label}
          value={stat.value}
          className="min-w-0"
          {...(stat.detail === undefined ? {} : { detail: stat.detail })}
          {...(stat.fraction === undefined ? {} : { fraction: stat.fraction })}
          {...(stat.info === undefined
            ? {}
            : {
                icon: (
                  <PanelCardInfo
                    label={say('screens.adminArea.statStrip.aboutLabel', { label: stat.label })}
                    detail={stat.info}
                    isList
                  />
                ),
              })}
        />
      ))}
    </div>
  );
};

StatStrip.displayName = 'StatStrip';

export { StatStrip };
