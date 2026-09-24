import { Icon } from '@ValenceUI/Icon';
import { Info as InfoIcon, MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import {
  Calendar as CalendarFilledIcon,
  Play as PlayFilledIcon,
  Stop as StopFilledIcon,
} from '@keyline-icons/react/fill';
import { useCallback, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { ClearLibraryPartsDialog } from '@ValenceScreens/components/AdminArea/components/ClearLibraryPartsDialog/ClearLibraryPartsDialog';
import { RunLibraryJobDialog } from '@ValenceScreens/components/AdminArea/components/RunLibraryJobDialog/RunLibraryJobDialog';
import { RunningWorkDialog } from '@ValenceScreens/components/AdminArea/components/RunningWorkDialog/RunningWorkDialog';
import { summariseProgress } from './summariseProgress';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { JobRunnerProps } from './JobRunner.types';
import { describeJobStatus } from '@ValenceScreens/status/describeJobStatus';

/**
 * Every job the server knows how to do, each with what it is for, whether it is running now and how
 * far along, and a way to start or stop it by hand. Pressing the i beside a running job opens what it is
 * doing, and pressing into a job opens what makes it run on its own, so the list stays a list rather than becoming a page of settings.
 *
 * Work against a library waits for work against a library, and nothing else waits for anything. The
 * rule was that one running job disabled Run now on every other, which is right for the thing it was
 * written for — two scans of one library at once is a fight over the same files — and wrong for
 * everything else it caught. Asking the transcoder whether it is answering is a ping down a socket,
 * and it was refused for the whole of a preview render, which is hours: the one job you want when
 * something looks wrong was the one the page would not let you run.
 *
 * A job that works on libraries asks which ones first, all of them ticked to begin with. The one that
 * clears parts of a library also asks which parts, and has no schedule, since a schedule would not
 * know what to clear.
 *
 * @param definitions - The jobs the server offers.
 * @param libraries - The libraries a job can be run against.
 * @param progress - What is running now, by library.
 * @param working - What the queue is working on.
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
  onRun,
  onStop,
  onOpenSchedule,
}: JobRunnerProps) => {
  const [confirming, setConfirming] = useState<JobDefinition | null>(null);
  const [choosing, setChoosing] = useState<JobDefinition | null>(null);
  const [clearing, setClearing] = useState<JobDefinition | null>(null);
  const [stopping, setStopping] = useState<JobDefinition | null>(null);
  const [watching, setWatching] = useState<JobDefinition | null>(null);

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

  const columns = useMemo<DataTableColumn<JobDefinition>[]>(
    () => [
      {
        id: 'job',
        header: 'Job',
        accessorFn: (definition) => definition.label,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-text">{row.original.label}</span>
            <span className="text-xs text-text-muted">{row.original.description}</span>
          </span>
        ),
      },
      {
        id: 'scope',
        header: 'Scope',
        accessorFn: (definition) => (definition.needsLibrary ? 'Libraries' : 'Server'),
        cell: ({ row }) => (
          <Badge size="sm">{row.original.needsLibrary ? 'Libraries' : 'Server'}</Badge>
        ),
      },
      {
        id: 'state',
        header: 'State',
        enableSorting: false,
        cell: ({ row }) => {
          const summary = summaryFor(row.original.kind);

          if (summary === null) {
            return (
              <Badge size="sm" tone="accent">
                Idle
              </Badge>
            );
          }

          return (
            <span className="flex items-center gap-1.5">
              <Badge
                size="sm"
                tone={describeJobStatus(summary.isStopping ? 'stopping' : 'running').tone}
              >
                {describeJobStatus(summary.isStopping ? 'stopping' : 'running').label}
              </Badge>

              <Button
                variant="subtle"
                size="none"
                isIconOnly
                label={`What ${row.original.label} is doing`}
                onClick={() => {
                  setWatching(row.original);
                }}
              >
                <Icon of={InfoIcon} size={15} />
              </Button>
            </span>
          );
        },
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={`Actions for ${row.original.label}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'run',
                      label: 'Run now',
                      icon: <Icon of={PlayFilledIcon} size={15} />,
                      isDestructive: row.original.destructive,
                      isDisabled:
                        row.original.needsLibrary &&
                        isBusyWithALibrary &&
                        summaryFor(row.original.kind) === null,
                      onChoose: () => {
                        askOrRun(row.original);
                      },
                    },
                    ...(summaryFor(row.original.kind) === null ||
                    summaryFor(row.original.kind)?.isStopping === true
                      ? []
                      : [
                          {
                            id: 'stop',
                            label: 'Stop it',
                            icon: <Icon of={StopFilledIcon} size={15} />,
                            isDestructive: true,
                            onChoose: () => {
                              ask(row.original);
                            },
                          },
                        ]),
                    ...(row.original.takesParts
                      ? []
                      : [
                          {
                            id: 'schedule',
                            label: 'Edit schedule',
                            icon: <Icon of={CalendarFilledIcon} size={15} />,
                            onChoose: () => {
                              onOpenSchedule(row.original.kind);
                            },
                          },
                        ]),
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ],
    [ask, summaryFor, onOpenSchedule, askOrRun, isBusyWithALibrary],
  );

  return (
    <>
      <DataTable label="Server jobs" columns={columns} rows={definitions} />

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
        title={watching?.label ?? ''}
        isOpen={watching !== null}
        progress={
          watchedSummary === null ? [] : [{ label: watching?.label ?? '', ...watchedSummary }]
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
        title={confirming === null ? 'Run this job?' : `${confirming.label}?`}
        detail={confirming === null ? '' : `${confirming.description} This cannot be undone.`}
        confirmLabel={confirming?.label ?? 'Run'}
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
        title={stopping === null ? 'Stop this job?' : `Stop ${stopping.label}?`}
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
