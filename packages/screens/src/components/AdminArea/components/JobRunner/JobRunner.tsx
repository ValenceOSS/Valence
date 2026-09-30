import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayAgainIfAny } from '@ValenceI18n/sayAgainIfAny';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Well } from '@ValenceUI/Well';
import { JOB_GROUPS } from '@ValenceContracts/schemas/JobGroup';
import { ClearLibraryPartsDialog } from '@ValenceScreens/components/AdminArea/components/ClearLibraryPartsDialog/ClearLibraryPartsDialog';
import { RunLibraryJobDialog } from '@ValenceScreens/components/AdminArea/components/RunLibraryJobDialog/RunLibraryJobDialog';
import { RunningWorkDialog } from '@ValenceScreens/components/AdminArea/components/RunningWorkDialog/RunningWorkDialog';
import { nextRunOf } from '@ValenceClient/admin/nextRunOf';
import { JobRunnerRow } from './components/JobRunnerRow/JobRunnerRow';
import { describeJobGroup } from './describeJobGroup';
import { summariseProgress } from './summariseProgress';
import type { JobDefinition, JobTrigger } from '@ValenceClient/admin/fetchAdmin';
import type { JobRunnerProps } from './JobRunner.types';

const NO_TRIGGERS: JobTrigger[] = [];

const TICK_MILLISECONDS = 1000;

/**
 * Every job the server knows how to do, in the groups the server puts them in, each with what it is
 * for, when it runs on its own, and a button to start or stop it by hand. Pressing the schedule opens
 * what makes it run, and pressing the i beside a running job opens what it is doing, so the list
 * stays a list rather than becoming a page of settings.
 *
 * Work against a library waits for work against a library, and nothing else waits for anything. The
 * rule was that one running job disabled Run now on every other, which is right for the thing it was
 * written for — two scans of one library at once is a fight over the same files — and wrong for
 * everything else it caught. Asking the transcoder whether it is answering is a ping down a socket,
 * and it was refused for the whole of a preview render, which is hours: the one job you want when
 * something looks wrong was the one the page would not let you run.
 *
 * A job that works on libraries asks which ones first, all of them ticked to begin with. The one that
 * clears parts of a library also asks which parts. Neither it nor the reset can be scheduled: one
 * would not know what to clear, and nobody wants the other happening at three in the morning.
 *
 * @param definitions - The jobs the server offers.
 * @param libraries - The libraries a job can be run against.
 * @param progress - What is running now, by library.
 * @param working - What the queue is working on.
 * @param schedules - What makes each job run on its own, by kind.
 * @param timezone - The zone the server reads its schedules in, or null to read them on this clock.
 * @param onRun - Called with the job to start, the libraries to start it on for one that takes
 *   them, and the parts to clear for the one that clears them.
 * @param onStop - Called with the job to stop.
 * @param onOpenSchedule - Called with the job whose schedule is to be opened.
 */
const JobRunner = ({
  definitions,
  libraries,
  progress,
  working,
  schedules,
  timezone = null,
  onRun,
  onStop,
  onOpenSchedule,
}: JobRunnerProps) => {
  const [confirming, setConfirming] = useState<JobDefinition | null>(null);
  const [choosing, setChoosing] = useState<JobDefinition | null>(null);
  const [clearing, setClearing] = useState<JobDefinition | null>(null);
  const [stopping, setStopping] = useState<JobDefinition | null>(null);
  const [watching, setWatching] = useState<JobDefinition | null>(null);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const zone = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const summaryFor = useCallback(
    (kind: string) =>
      summariseProgress([...progress.values()].filter((entry) => entry.kind === kind)),
    [progress],
  );

  const jobIdsFor = useCallback(
    (kind: string) =>
      new Set(
        [...progress.values()]
          .filter((entry) => entry.kind === kind && entry.jobId !== null)
          .map((entry) => entry.jobId ?? ''),
      ),
    [progress],
  );

  const askOrRun = useCallback(
    (definition: JobDefinition) => {
      if (definition.takesParts) {
        setClearing(definition);

        return;
      }

      if (definition.needsLibrary) {
        setChoosing(definition);

        return;
      }

      if (definition.destructive) {
        setConfirming(definition);

        return;
      }

      onRun(definition.kind);
    },
    [onRun],
  );

  const ask = useCallback((definition: JobDefinition) => {
    setStopping(definition);
  }, []);

  const watchedSummary = watching === null ? null : summaryFor(watching.kind);

  const isBusyWithALibrary = definitions.some(
    (definition) => definition.needsLibrary && summaryFor(definition.kind) !== null,
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {JOB_GROUPS.map((group) => {
          const inGroup = definitions.filter(
            (definition) => definition.group === group && definition.runsByHand,
          );

          if (inGroup.length === 0) {
            return null;
          }

          return (
            <HeadedSection key={group} title={describeJobGroup(group)}>
              <Well isFlush>
                <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
                  {inGroup.map((definition) => (
                    <JobRunnerRow
                      key={definition.kind}
                      definition={definition}
                      triggers={schedules.get(definition.kind) ?? NO_TRIGGERS}
                      nextRunAt={
                        definition.schedulable
                          ? nextRunOf(
                              (schedules.get(definition.kind) ?? NO_TRIGGERS).map(
                                (entry) => entry.trigger,
                              ),
                              zone,
                              new Date(now),
                            )
                          : null
                      }
                      now={now}
                      summary={summaryFor(definition.kind)}
                      isRunBlocked={
                        definition.needsLibrary &&
                        isBusyWithALibrary &&
                        summaryFor(definition.kind) === null
                      }
                      onRun={askOrRun}
                      onStop={ask}
                      onWatch={setWatching}
                      onOpenSchedule={onOpenSchedule}
                    />
                  ))}
                </ul>
              </Well>
            </HeadedSection>
          );
        })}
      </div>

      <ClearLibraryPartsDialog
        definition={clearing}
        libraries={libraries}
        onClose={() => {
          setClearing(null);
        }}
        onClear={(kind, libraryIds, parts) => {
          onRun(kind, libraryIds, parts);
          setClearing(null);
        }}
      />

      <RunLibraryJobDialog
        definition={choosing}
        libraries={libraries}
        onClose={() => {
          setChoosing(null);
        }}
        onRun={(kind, libraryIds) => {
          onRun(kind, libraryIds);
          setChoosing(null);
        }}
      />

      <RunningWorkDialog
        title={sayAgainIfAny(watching?.label) ?? ''}
        isOpen={watching !== null}
        progress={
          watchedSummary === null
            ? []
            : [{ label: sayAgainIfAny(watching?.label) ?? '', ...watchedSummary }]
        }
        tasks={
          watching === null
            ? []
            : working.filter(
                (job) =>
                  job.correlationId !== null && jobIdsFor(watching.kind).has(job.correlationId),
              )
        }
        onClose={() => {
          setWatching(null);
        }}
      />

      <ConfirmDialog
        isOpen={confirming !== null}
        title={confirming === null ? 'Run this job?' : `${sayAgain(confirming.label)}?`}
        detail={
          confirming === null ? '' : `${sayAgain(confirming.description)} This cannot be undone.`
        }
        confirmLabel={sayAgainIfAny(confirming?.label) ?? 'Run'}
        isDestructive
        onClose={() => {
          setConfirming(null);
        }}
        onConfirm={() => {
          if (confirming === null) {
            return;
          }

          onRun(confirming.kind);
          setConfirming(null);
        }}
      />

      <ConfirmDialog
        isOpen={stopping !== null}
        title={stopping === null ? 'Stop this job?' : `Stop ${sayAgain(stopping.label)}?`}
        detail="What it has done so far is kept, and the rest is left undone until it is run again."
        confirmLabel="Stop it"
        isDestructive
        onClose={() => {
          setStopping(null);
        }}
        onConfirm={() => {
          if (stopping === null) {
            return;
          }

          onStop(stopping.kind);
          setStopping(null);
        }}
      />
    </>
  );
};

JobRunner.displayName = 'JobRunner';

export { JobRunner };
