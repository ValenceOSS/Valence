import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { cn } from '@ValenceUI/cn';
import type { JobRunMixProps } from './JobRunMix.types';

const SEGMENTS = [
  { id: 'completed', dot: 'bg-success' },
  { id: 'failed', dot: 'bg-danger' },
  { id: 'stopped', dot: 'bg-text-muted' },
] as const;

/**
 * How the job runs stand, in one line: how many are running now, with a dot that breathes while any
 * are, and how many completed, failed and stopped, then how many of those that finished succeeded.
 * A thin bar beneath splits the finished runs by how they ended, so a run of failures shows as red
 * at a glance rather than as a number to read.
 *
 * @param running - How many are running now.
 * @param completed - How many completed.
 * @param failed - How many failed.
 * @param stopped - How many were stopped.
 */
const JobRunMix = ({ running, completed, failed, stopped }: JobRunMixProps) => {
  const counts = { completed, failed, stopped };
  const finished = completed + failed + stopped;
  const succeeded = finished === 0 ? null : Math.round((completed / finished) * 100);

  return (
    <section aria-label="How the job runs stand" className="flex flex-col gap-3 px-1">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              'size-2 rounded-full',
              running > 0 ? 'animate-pulse bg-busy' : 'bg-text-muted/50',
            )}
          />
          <span className="text-lg font-semibold tabular-nums text-text">
            <AnimatedNumber value={running} />
          </span>
          <span className="text-sm text-text-muted">running now</span>
        </p>

        {SEGMENTS.map((segment) => (
          <p key={segment.id} className="flex items-center gap-2">
            <span aria-hidden className={cn('size-2 rounded-full', segment.dot)} />
            <span
              className={cn(
                'text-lg font-semibold tabular-nums',
                segment.id === 'failed' && failed > 0 ? 'text-danger' : 'text-text',
              )}
            >
              <AnimatedNumber value={counts[segment.id]} />
            </span>
            <span className="text-sm text-text-muted">{segment.id}</span>
          </p>
        ))}

        {succeeded === null ? null : (
          <p className="ml-auto flex items-center gap-2">
            <span className="text-sm text-text-muted">succeeded</span>
            <span className="text-lg font-semibold tabular-nums text-text">
              <AnimatedNumber value={succeeded} suffix="%" />
            </span>
          </p>
        )}
      </div>

      <div
        role="img"
        aria-label={`${completed.toString()} completed, ${failed.toString()} failed, ${stopped.toString()} stopped`}
        className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--color-track)]"
      >
        {finished === 0
          ? null
          : SEGMENTS.map((segment) =>
              counts[segment.id] === 0 ? null : (
                <span
                  key={segment.id}
                  className={cn('h-full transition-[flex-grow] duration-500', segment.dot)}
                  style={{ flexGrow: counts[segment.id] }}
                />
              ),
            )}
      </div>
    </section>
  );
};

JobRunMix.displayName = 'JobRunMix';

export { JobRunMix };
