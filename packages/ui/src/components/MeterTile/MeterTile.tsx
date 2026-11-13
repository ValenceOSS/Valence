import { cn } from '@ValenceUI/cn';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TickMeter } from '@ValenceUI/TickMeter';
import type { MeterTileProps } from './MeterTile.types';

const WARNS_FROM = 0.75;

const ALARMS_FROM = 0.9;

/**
 * One figure about the server, drawn as a small card like every other: what it is on the shell, and
 * on the panel set into it the figure, a line qualifying it where there is one, and how full it is
 * as a row of ticks, turning amber and then red as it nears the top. Kept to one short row so a
 * strip of them takes little height above the rest of the page.
 *
 * @param label - What the figure is.
 * @param value - The figure itself, formatted for reading.
 * @param detail - A line qualifying it, such as what it is out of.
 * @param fraction - How full, where the figure is part of a fixed whole.
 * @param icon - Something to draw on the shell beside the label, such as a mark opening more detail.
 * @param className - Extra classes for the caller's own layout.
 */
const MeterTile = ({ label, value, detail, fraction, icon, className }: MeterTileProps) => (
  <PanelCard
    title={label}
    {...(icon === undefined ? {} : { actions: icon })}
    isCompact
    isFlush
    className={cn('min-w-0', className)}
  >
    <div className="flex min-w-0 items-center gap-4 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-lg font-semibold tabular-nums leading-6 tracking-tight text-text">
          {value}
        </span>
        {detail === undefined ? null : (
          <span className="truncate font-body text-[0.6875rem] leading-4 text-text-muted">
            {detail}
          </span>
        )}
      </div>

      {fraction === undefined ? null : (
        <TickMeter
          fraction={fraction}
          ticks={20}
          tone={fraction >= ALARMS_FROM ? 'danger' : fraction >= WARNS_FROM ? 'warning' : 'primary'}
          className="ms-auto h-5 w-[55%] max-w-48 shrink-0"
        />
      )}
    </div>
  </PanelCard>
);

MeterTile.displayName = 'MeterTile';

export { MeterTile };
