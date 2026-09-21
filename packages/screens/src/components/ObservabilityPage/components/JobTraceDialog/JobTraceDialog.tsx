import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { TimeBars } from '@ValenceUI/TimeBars';
import { notify } from '@ValenceUI/notify';
import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { describeElapsed } from '@ValenceClient/admin/describeElapsed';
import { describeWords } from '@ValenceClient/admin/describeWords';
import { useTicking } from '@ValenceScreens/admin/useTicking';
import { ElapsedTime } from '@ValenceScreens/components/ElapsedTime/ElapsedTime';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { describeLogSpan, describeLogTick } from '@ValenceClient/admin/describeLogTick';
import { logsAsText } from '@ValenceClient/admin/logsAsText';
import { describeLogLevel } from '@ValenceScreens/admin/describeLogLevel';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import type { JobTraceDialogProps } from './JobTraceDialog.types';

const LINES = 500;

const BARS = 40;

const LIVE_EVERY_MS = 2000;

const writeToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

/**
 * Follows one run of a job from start to end: what kind of job it was and how it ended, how long it
 * took, how far it got, and every line it logged in the order it wrote them, each with how long after
 * the start it was said — so "it stalled at the third minute" is read straight off the page.
 *
 * The lines are the log filtered to this run and read oldest first, the same records the explorer
 * shows, so anything that can be done to a line there can be done from here by opening the run in the
 * log. The graph shows when in the run the noise came, which is usually where the trouble was.
 *
 * @param jobRunId - The run to follow, or null where none is open.
 * @param definitions - The jobs the server offers, for naming the run's kind.
 * @param onClose - Told to dismiss the dialog.
 * @param onOpenInLogs - Told the run's id, to open the log narrowed to it.
 * @param copy - How text reaches the clipboard.
 */
const JobTraceDialog = ({
  jobRunId,
  definitions,
  onClose,
  onOpenInLogs,
  copy = writeToClipboard,
}: JobTraceDialogProps) => {
  const cache = useQueryClient();
  const askedRun = useQuery({
    ...adminQueries.jobRun(jobRunId),
    refetchInterval: ({ state }) =>
      state.data?.status === 'running' || state.data?.status === 'queued' ? LIVE_EVERY_MS : false,
  });
  const isRunning = askedRun.data?.status === 'running';
  const isLive = isRunning || askedRun.data?.status === 'queued';
  const liveEvery = isLive ? LIVE_EVERY_MS : false;
  const askedLines = useQuery({
    ...adminQueries.logs({
      jobId: jobRunId,
      levels: [...LOG_LEVELS],
      sort: 'oldest',
      limit: LINES,
    }),
    enabled: jobRunId !== null,
    refetchInterval: liveEvery,
  });
  const askedBars = useQuery({
    ...adminQueries.logHistogram({ jobId: jobRunId, levels: [...LOG_LEVELS], buckets: BARS }),
    enabled: jobRunId !== null,
    refetchInterval: liveEvery,
  });
  const askedIssues = useQuery({
    ...adminQueries.jobHistoryIssues(jobRunId),
    refetchInterval: liveEvery,
  });
  const now = useTicking(isRunning);
  const wasLive = useRef(false);

  useEffect(() => {
    if (wasLive.current && !isLive) {
      void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'logs'] });
      void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'logHistogram'] });
      void cache.invalidateQueries({ queryKey: [...adminQueries.key, 'jobHistoryIssues'] });
    }

    wasLive.current = isLive;
  }, [cache, isLive]);

  const run = askedRun.data ?? null;
  const lines = askedLines.data?.records ?? [];
  const bars = askedBars.data;
  const labels = new Map(definitions.map((one) => [one.kind, one.label]));
  const label = run === null ? 'Job run' : describeJobKind(run.kind, labels);
  const status = run === null ? null : describeJobStatus(run.status);
  const startedAt = run?.startedAtMs ?? run?.createdAtMs ?? lines[0]?.atMs ?? 0;
  const tookMs =
    run === null || run.startedAtMs === null || run.finishedAtMs === null
      ? null
      : run.finishedAtMs - run.startedAtMs;
  const issues = askedIssues.data ?? [];
  const progress = run?.progress ?? null;

  return (
    <Dialog label="Job trace" isOpen={jobRunId !== null} onClose={onClose} size="stage">
      <DialogTitle
        title={label}
        detail={jobRunId === null ? undefined : `Run ${jobRunId}`}
        size="compact"
      />

      <DialogContent>
        <div className="flex flex-col gap-4">
          {askedRun.isPending ? (
            <p className="text-sm text-text-muted">Reading the run…</p>
          ) : run === null ? (
            <Callout title="This run is no longer in the history" tone="quiet">
              Runs are kept for a month. Whatever it logged may still be in the log.
            </Callout>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">Status</dt>
                  <dd>
                    {status === null ? null : (
                      <Badge size="sm" tone={status.tone}>
                        {status.label}
                      </Badge>
                    )}
                  </dd>
                </div>

                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">Started</dt>
                  <dd className="tabular-nums text-text">
                    {run.startedAtMs === null
                      ? 'Waiting to start'
                      : `${describeLogDay(run.startedAtMs)}, ${describeLogTime(run.startedAtMs)}`}
                  </dd>
                </div>

                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">
                    {run.finishedAtMs === null ? 'Running for' : 'Took'}
                  </dt>
                  <dd className="tabular-nums text-text">
                    {tookMs === null ? (
                      run.startedAtMs === null ? (
                        '—'
                      ) : (
                        <ElapsedTime ms={Math.max(0, now - run.startedAtMs)} />
                      )
                    ) : (
                      <ElapsedTime ms={tookMs} />
                    )}
                  </dd>
                </div>

                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">Lines logged</dt>
                  <dd className="tabular-nums text-text">
                    <AnimatedNumber value={askedLines.data?.total ?? 0} />
                  </dd>
                </div>
              </dl>

              {progress === null ? null : (
                <ProgressBar
                  label={`${label} progress`}
                  value={progress.total === 0 ? null : progress.processed}
                  max={Math.max(progress.total, 1)}
                  readout={
                    <span>
                      {describeWords(progress.phase)} ·{' '}
                      <AnimatedNumber value={progress.processed} /> of{' '}
                      <AnimatedNumber value={progress.total} />
                    </span>
                  }
                />
              )}

              {run.errorMessage === null ? null : (
                <Callout title="How it failed" tone="danger">
                  {run.errorMessage}
                </Callout>
              )}

              {issues.length === 0 ? null : (
                <Callout
                  title={`${issues.length.toLocaleString()} issues were recorded`}
                  tone="warning"
                >
                  Open “View issues” on the run for each file and why it was skipped.
                </Callout>
              )}
            </>
          )}

          {bars === undefined || bars.buckets.length === 0 ? null : (
            <TimeBars
              bars={bars.buckets.map((bucket) => ({
                atMs: bucket.atMs,
                values: {
                  debug: bucket.debug,
                  info: bucket.info,
                  warn: bucket.warn,
                  error: bucket.error,
                },
              }))}
              series={LOG_LEVELS.map((level) => ({
                key: level,
                label: describeLogLevel(level).label,
                colour: describeLogLevel(level).colour,
              }))}
              bucketMs={bars.bucketMs}
              label="How much this run logged, over the time it ran"
              formatTick={(atMs) => describeLogTick(atMs, bars.untilMs - bars.fromMs)}
              formatSpan={describeLogSpan}
            />
          )}

          {askedLines.isPending ? (
            <p className="text-sm text-text-muted">Reading what it logged…</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-text-muted">
              This run logged nothing, or what it logged has been forgotten.
            </p>
          ) : (
            <ol
              aria-label="What this run logged, in order"
              className="flex max-h-[45vh] flex-col overflow-y-auto rounded-lg bg-[var(--surface-hover)] py-1 font-mono text-xs"
            >
              {lines.map((line) => {
                const look = describeLogLevel(line.level);

                return (
                  <li
                    key={line.id}
                    className="flex gap-3 border-l-2 px-3 py-0.5"
                    style={{ borderLeftColor: look.colour }}
                  >
                    <span className="w-16 shrink-0 text-right tabular-nums text-text-muted">
                      {`+${describeElapsed(Math.max(0, line.atMs - startedAt))}`}
                    </span>

                    <span
                      className="w-12 shrink-0 font-semibold uppercase"
                      style={{ color: look.colour }}
                    >
                      {line.level}
                    </span>

                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-text">
                      {line.message}
                      {line.count > 1 ? (
                        <span className="text-text-muted">{` ×${line.count.toLocaleString()}`}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ label: 'Close', onChoose: onClose }}
        confirm={{
          label: 'Open in the log',
          isDisabled: jobRunId === null,
          onChoose: () => {
            if (jobRunId !== null) {
              onOpenInLogs(jobRunId);
            }
          },
        }}
      >
        <Button
          variant="ghost"
          disabled={lines.length === 0}
          onClick={() => {
            void copy(logsAsText(lines)).then(() => {
              notify.worked('Copied the trace.');
            });
          }}
        >
          Copy trace
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

JobTraceDialog.displayName = 'JobTraceDialog';

export { JobTraceDialog };
