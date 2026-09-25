import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Button } from '@ValenceUI/Button';
import { Skeleton } from '@ValenceUI/Skeleton';
import { describeLogLevel } from '@ValenceScreens/admin/describeLogLevel';
import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import type { LevelTogglesProps } from './LevelToggles.types';

/**
 * Says how many events of each level there were over the stretch of time being looked at, and lets
 * each level be switched on or off — the totals, the graph's legend and the level filter as one row,
 * rather than as three places that have to be kept in agreement.
 *
 * The counts are of every level whether it is switched on or not, so switching errors off does not
 * make it look as though there were none. A level cannot be switched off if it is the last one on,
 * since a log with every level off is not a smaller log but an empty one.
 *
 * @param histogram - The log counted over time for every level, or nothing before it has been read.
 * @param levels - The levels that are switched on.
 * @param isReading - Whether the figures are being read again.
 * @param onToggle - Told which level was pressed.
 */
const LevelToggles = ({ histogram, levels, isReading, onToggle }: LevelTogglesProps) => {
  if (histogram === undefined) {
    return <Skeleton className="h-9 w-full max-w-xl" />;
  }

  const totals = LOG_LEVELS.map((level) => ({
    level,
    count: histogram.buckets.reduce((sum, bucket) => sum + bucket[level], 0),
  }));
  const events = totals.reduce((sum, one) => sum + one.count, 0);

  return (
    <div
      aria-busy={isReading}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
    >
      <p className="text-sm text-text-muted">
        <span className="text-lg font-semibold tabular-nums text-text">
          <AnimatedNumber value={events} />
        </span>{' '}
        {sayCount('screens.levelToggles.events', events)}
      </p>

      <ul
        aria-label={say('screens.levelToggles.levelsLabel')}
        className="flex flex-wrap items-center justify-end gap-1"
      >
        {totals.map(({ level, count }) => {
          const look = describeLogLevel(level);
          const isOn = levels.includes(level);

          return (
            <li key={level}>
              <Button
                variant={isOn ? 'secondary' : 'ghost'}
                isActive={isOn}
                size="xs"
                disabled={isOn && levels.length === 1}
                onClick={() => {
                  onToggle(level);
                }}
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: isOn ? look.colour : 'var(--surface-active)' }}
                />
                {look.label}
                <span className="tabular-nums text-text-muted">
                  <AnimatedNumber value={count} />
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

LevelToggles.displayName = 'LevelToggles';

export { LevelToggles };
