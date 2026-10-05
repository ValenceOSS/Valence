import { sayAgain } from '@ValenceI18n/sayAgain';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { TimeBars } from '@ValenceUI/TimeBars';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Well } from '@ValenceUI/Well';
import { LevelToggles } from '@ValenceScreens/components/ObservabilityPage/components/LevelToggles/LevelToggles';
import { notify } from '@ValenceUI/notify';
import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import type { LogLevel } from '@ValenceContracts/schemas/Log';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { describeJobKind } from '@ValenceClient/admin/describeJobKind';
import { describeElapsed } from '@ValenceClient/admin/describeElapsed';
import { describeWords } from '@ValenceClient/admin/describeWords';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { ElapsedTime } from '@ValenceScreens/components/ElapsedTime/ElapsedTime';
import { describeLogDay, describeLogTime } from '@ValenceClient/admin/describeLogTime';
import { describeLogSpan, describeLogTick } from '@ValenceClient/admin/describeLogTick';
import { logsAsText } from '@ValenceClient/admin/logsAsText';
import { describeLogLevel } from '@ValenceScreens/admin/describeLogLevel';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';
import type { JobTraceDialogProps } from './JobTraceDialog.types';
import { say } from '@ValenceI18n/say';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { sayCount } from '@ValenceI18n/sayCount';

const A_SECOND = 1000;

const LINES = 500;

const BARS = 40;

const LIVE_EVERY_MS = 2000;

const FACT =
  'flex flex-col gap-1.5 border-[var(--surface-line)] px-4 py-3 max-sm:odd:border-r sm:not-first:border-l max-sm:nth-[n+3]:border-t';

const FACT_NAME = 'text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-text/50';

const FACT_VALUE = 'text-sm font-medium tabular-nums text-text';

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
  const now = useTicking(A_SECOND, isRunning);
  const wasLive = useRef(false);
  const [levels, setLevels] = useState<LogLevel[]>([...LOG_LEVELS]);

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
  const labels = new Map(definitions.map((one) => [one.kind, sayAgain(one.label)]));
  const label =
    run === null
      ? say('screens.observabilityPage.jobTraceDialog.jobRun')
      : describeJobKind(run.kind, labels);
  const status = run === null ? null : describeJobStatus(run.status);
  const startedAt = run?.startedAtMs ?? run?.createdAtMs ?? lines[0]?.atMs ?? 0;
  const tookMs =
    run === null || run.startedAtMs === null || run.finishedAtMs === null
      ? null
      : run.finishedAtMs - run.startedAtMs;
  const issues = askedIssues.data ?? [];
  const progress = run?.progress ?? null;
  const shownLines = lines.filter((line) => levels.includes(line.level));

  const toggleLevel = (level: LogLevel) => {
    setLevels((before) =>
      before.includes(level) ? before.filter((one) => one !== level) : [...before, level],
    );
  };

  return (
    <Dialog
      label={say('screens.observabilityPage.jobTraceDialog.jobTrace')}
      isOpen={jobRunId !== null}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        title={label}
        detail={
          jobRunId === null
            ? undefined
            : say('screens.observabilityPage.jobTraceDialog.runJobRunId', { jobRunId })
        }
        size="compact"
      />

      <DialogContent>
        <div className="flex flex-col gap-5">
          {askedRun.isPending ? (
            <p className="text-sm text-text-muted">
              {say('screens.observabilityPage.jobTraceDialog.readingTheRun')}
            </p>
          ) : run === null ? (
            <Callout
              title={say('screens.observabilityPage.jobTraceDialog.thisRunIsNoLongerIn')}
              tone="quiet"
            >
              {say('screens.observabilityPage.jobTraceDialog.runsAreKeptForAMonth')}
            </Callout>
          ) : (
            <>
              <Well isFlush className="overflow-hidden">
                <dl className="grid grid-cols-2 sm:grid-cols-4">
                  <div className={FACT}>
                    <dt className={FACT_NAME}>{say('common.status')}</dt>
                    <dd>
                      {status === null ? null : (
                        <Badge size="sm" tone={status.tone}>
                          {status.label}
                        </Badge>
                      )}
                    </dd>
                  </div>

                  <div className={FACT}>
                    <dt className={FACT_NAME}>
                      {say('screens.observabilityPage.jobTraceDialog.started')}
                    </dt>
                    <dd className={FACT_VALUE}>
                      {run.startedAtMs === null
                        ? say('screens.observabilityPage.jobTraceDialog.waitingToStart')
                        : `${describeLogDay(run.startedAtMs)}, ${describeLogTime(run.startedAtMs)}`}
                    </dd>
                  </div>

                  <div className={FACT}>
                    <dt className={FACT_NAME}>
                      {run.finishedAtMs === null
                        ? say('screens.observabilityPage.jobTraceDialog.runningFor')
                        : say('common.took')}
                    </dt>
                    <dd className={FACT_VALUE}>
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

                  <div className={FACT}>
                    <dt className={FACT_NAME}>
                      {say('screens.observabilityPage.jobTraceDialog.linesLogged')}
                    </dt>
                    <dd className={FACT_VALUE}>
                      <FormattedNumber value={askedLines.data?.total ?? 0} />
                    </dd>
                  </div>
                </dl>

                {progress === null ? null : (
                  <div className="flex flex-col gap-2 border-t border-[var(--surface-line)] px-4 py-3">
                    <span className="text-xs text-text-muted">
                      <span className="font-medium text-text">
                        {describeWords(sayAgain(progress.phase))}
                      </span>
                      {' · '}
                      <Sentence
                        words="common.doneOfTotal"
                        fillings={{
                          done: <FormattedNumber value={progress.processed} />,
                          total: <FormattedNumber value={progress.total} />,
                        }}
                      />
                    </span>

                    <ProgressBar
                      label={say('screens.observabilityPage.jobTraceDialog.labelProgress', {
                        label,
                      })}
                      value={progress.total === 0 ? null : progress.processed}
                      max={Math.max(progress.total, 1)}
                      isFull
                    />
                  </div>
                )}
              </Well>

              {run.errorMessage === null ? null : (
                <Callout
                  title={say('screens.observabilityPage.jobTraceDialog.howItFailed')}
                  tone="danger"
                >
                  {sayAgain(run.errorMessage)}
                </Callout>
              )}

              {issues.length === 0 ? null : (
                <Callout
                  title={sayCount(
                    'screens.observabilityPage.jobTraceDialog.issuesWereRecorded',
                    issues.length,
                  )}
                  tone="warning"
                >
                  {say('screens.observabilityPage.jobTraceDialog.openViewIssuesOnTheRun')}
                </Callout>
              )}
            </>
          )}

          {bars === undefined || bars.buckets.length === 0 ? null : (
            <Well className="flex flex-col gap-3">
              <LevelToggles
                histogram={bars}
                levels={levels}
                isReading={askedBars.isFetching}
                onToggle={toggleLevel}
              />

              <TimeBars
                hasLegend={false}
                bars={bars.buckets.map((bucket) => ({
                  atMs: bucket.atMs,
                  values: {
                    debug: bucket.debug,
                    info: bucket.info,
                    warn: bucket.warn,
                    error: bucket.error,
                  },
                }))}
                series={LOG_LEVELS.filter((level) => levels.includes(level)).map((level) => ({
                  key: level,
                  label: describeLogLevel(level).label,
                  colour: describeLogLevel(level).colour,
                }))}
                bucketMs={bars.bucketMs}
                label={say('screens.observabilityPage.jobTraceDialog.howMuchThisRunLoggedOver')}
                formatTick={(atMs) => describeLogTick(atMs, bars.untilMs - bars.fromMs)}
                formatSpan={describeLogSpan}
              />
            </Well>
          )}

          <HeadedSection
            isInset
            title={say('screens.observabilityPage.logExplorer.logLines')}
            actions={
              <span aria-live="polite" className="text-xs tabular-nums text-text-muted">
                <Sentence
                  words="screens.observabilityPage.logExplorer.showingShownOfTotal"
                  fillings={{
                    shown: <FormattedNumber value={shownLines.length} />,
                    total: <FormattedNumber value={askedLines.data?.total ?? 0} />,
                  }}
                />
              </span>
            }
          >
            <div className="-m-3 sm:-m-4">
              {askedLines.isPending ? (
                <p className="px-4 py-6 text-sm text-text-muted">
                  {say('screens.observabilityPage.jobTraceDialog.readingWhatItLogged')}
                </p>
              ) : shownLines.length === 0 ? (
                <p className="px-4 py-6 text-sm text-text-muted">
                  {say('screens.observabilityPage.jobTraceDialog.thisRunLoggedNothingOrWhat')}
                </p>
              ) : (
                <ol
                  aria-label={say(
                    'screens.observabilityPage.jobTraceDialog.whatThisRunLoggedInOrder',
                  )}
                  className="flex max-h-[45vh] flex-col divide-y divide-[var(--surface-line)] overflow-y-auto overscroll-contain font-mono text-xs"
                >
                  {shownLines.map((line) => {
                    const look = describeLogLevel(line.level);

                    return (
                      <li
                        key={line.id}
                        className="flex items-start gap-2.5 border-l-2 px-3 py-1.5"
                        style={{ borderLeftColor: look.colour }}
                      >
                        <span className="w-24 shrink-0 whitespace-nowrap text-right tabular-nums text-text-muted">
                          {`+${describeElapsed(Math.max(0, line.atMs - startedAt))}`}
                        </span>

                        <span
                          className="w-14 shrink-0 font-semibold uppercase"
                          style={{ color: look.colour }}
                        >
                          {line.level}
                        </span>

                        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-text">
                          {line.message}
                        </span>

                        {line.count > 1 ? (
                          <Badge size="sm" tone="quiet">
                            {`×${line.count.toLocaleString()}`}
                          </Badge>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </HeadedSection>
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ label: say('common.close'), onChoose: onClose }}
        confirm={{
          label: say('screens.observabilityPage.jobTraceDialog.openInTheLog'),
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
              notify.worked(say('screens.observabilityPage.jobTraceDialog.copiedTheTrace'));
            });
          }}
        >
          {say('screens.observabilityPage.jobTraceDialog.copyTrace')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

JobTraceDialog.displayName = 'JobTraceDialog';

export { JobTraceDialog };
