import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { cn } from '@ValenceUI/cn';
import type { ScanProgressBarProps } from './ScanProgressBar.types';

const PHASE_LABELS: Record<string, StringKey> = {
  probing: 'admin.scanProgressBar.phase.probing',
  previews: 'admin.scanProgressBar.phase.previews',
  trickplay: 'admin.scanProgressBar.phase.trickplay',
  segments: 'admin.scanProgressBar.phase.segments',
  clearing: 'admin.scanProgressBar.phase.clearing',
};

/**
 * How far through a scan something actually is: which stage it has reached, and how many files it has
 * got through where it is counting them. A scan that reports no counts still shows movement rather
 * than an empty bar, since the absence of a count is not the absence of progress.
 *
 * Names the file it is on where it says which, since a count moving from 4,101 to 4,102 tells
 * somebody it is alive and nothing else. Truncated rather than wrapped: the bar sits in a row, and a
 * long release name would otherwise push everything beside it out of line.
 *
 * @param label - What is being worked on.
 * @param phase - The stage it has reached, where it reports one.
 * @param processed - How many files it has got through, where it counts them.
 * @param total - How many there are in all, where that is known.
 * @param item - What it is working on this moment, where it says.
 * @param isStopping - Whether it has been asked to stop and has not yet, in which case the bar says so
 *   instead of what it is on, since it is finishing what it had begun and starting nothing new.
 */
const ScanProgressBar = ({
  label,
  phase,
  processed,
  total,
  item,
  isStopping = false,
}: ScanProgressBarProps) => {
  const isKnown = processed !== null && total !== null;
  const fraction = !isKnown || total === 0 ? 0 : Math.min(processed / total, 1);
  const isEmpty = isKnown && total === 0;
  const phaseKey = phase === null ? undefined : PHASE_LABELS[phase];
  const phaseLabel = phase === null ? null : phaseKey === undefined ? phase : say(phaseKey);

  return (
    <div
      role="progressbar"
      aria-label={
        phaseLabel === null
          ? label
          : say('admin.scanProgressBar.labelWithPhase', { label, phase: phaseLabel })
      }
      {...(isKnown
        ? { 'aria-valuenow': processed, 'aria-valuemin': 0, 'aria-valuemax': total }
        : {})}
      className="flex shrink-0 items-center gap-2"
    >
      {isStopping ? (
        <span className="shrink-0 text-xs text-warning">
          {say('admin.scanProgressBar.stopping')}
        </span>
      ) : phaseLabel === null ? null : (
        <span className="shrink-0 text-xs text-text-muted">{phaseLabel}</span>
      )}

      <span className="block h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--surface-hover)]">
        <span
          style={isKnown && !isEmpty ? { width: `${(fraction * 100).toString()}%` } : undefined}
          className={cn(
            'block h-full rounded-full bg-primary',
            isKnown ? 'transition-[width] duration-300' : 'w-full animate-pulse',
            isEmpty ? 'w-full' : '',
          )}
        />
      </span>

      {isKnown && !isEmpty ? (
        <span className="shrink-0 text-xs tabular-nums text-text-muted">
          <AnimatedNumber value={processed} />/<AnimatedNumber value={total} />
        </span>
      ) : null}

      {item === null || item === undefined || item === '' ? null : (
        <span className="min-w-0 truncate text-xs text-text-muted" title={item}>
          {item}
        </span>
      )}
    </div>
  );
};

ScanProgressBar.displayName = 'ScanProgressBar';

export { ScanProgressBar };
