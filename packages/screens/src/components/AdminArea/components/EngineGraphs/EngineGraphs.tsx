import { TrendChart } from '@ValenceUI/TrendChart';
import { cn } from '@ValenceUI/cn';
import { GROUP_LABEL } from '@ValenceUI/tokens/GROUP_LABEL';
import { InfoNote } from '@ValenceUI/InfoNote';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import { say } from '@ValenceI18n/say';
import type { EngineGraphsProps, EngineReading } from './EngineGraphs.types';

const ENGINES = [
  { key: 'render', label: say('screens.adminArea.engineGraphs.threeD') },
  { key: 'copy', label: say('common.copy') },
  { key: 'video', label: say('screens.adminArea.engineGraphs.video') },
  { key: 'videoEnhance', label: say('screens.adminArea.engineGraphs.videoEnhance') },
] as const satisfies readonly { key: keyof EngineReading; label: string }[];

/**
 * What each engine of the graphics card has been doing, the way a task manager shows it: a small
 * graph of the last few minutes for 3D work, copies, video encoding and decoding, and the scaling
 * and colour work beside it, each with where it stands now, and a graph of the memory held on the
 * card. An engine the driver keeps no time for is left out rather than drawn idle, and where there
 * is nothing to draw at all the section is left out with it. The figures are
 * Valence's own work on the card, which is said beneath them.
 *
 * @param history - The readings so far, oldest first.
 */
const EngineGraphs = ({ history }: EngineGraphsProps) => {
  const latest = history.at(-1);
  const shown = ENGINES.filter((engine) => history.some((reading) => reading[engine.key] !== null));
  const memory = history.map((reading) => reading.memoryBytes ?? 0);
  const hasMemory = history.some((reading) => reading.memoryBytes !== null);

  if (shown.length === 0 && !hasMemory) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 px-2.5 pb-1 pt-1">
      <span className={cn('block', GROUP_LABEL)}>
        {say('screens.adminArea.engineGraphs.engines')}
      </span>

      <div className="grid grid-cols-2 gap-3">
        {shown.map((engine) => (
          <div key={engine.key} className="flex min-w-0 flex-col gap-1">
            <span className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-text-muted">{engine.label}</span>
              <span className="font-medium tabular-nums text-text">
                <FormattedNumber value={Math.round(latest?.[engine.key] ?? 0)} suffix="%" />
              </span>
            </span>
            <TrendChart
              values={history.map((reading) => reading[engine.key] ?? 0)}
              ceiling={100}
              label={engine.label}
            />
          </div>
        ))}

        {hasMemory ? (
          <div className="col-span-2 flex min-w-0 flex-col gap-1">
            <span className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-text-muted">
                {say('screens.adminArea.engineGraphs.memoryOnTheCard')}
              </span>
              <span className="font-medium tabular-nums text-text">
                <FormattedBytes bytes={latest?.memoryBytes ?? 0} />
              </span>
            </span>
            <TrendChart
              values={memory}
              ceiling={Math.max(...memory, 1) * 1.25}
              label={say('screens.adminArea.engineGraphs.memoryOnTheCard')}
            />
          </div>
        ) : null}
      </div>

      <InfoNote>{say('screens.adminArea.engineGraphs.onlyValencesOwnWork')}</InfoNote>
    </div>
  );
};

EngineGraphs.displayName = 'EngineGraphs';

export { EngineGraphs };
