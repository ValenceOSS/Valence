import { Icon } from '@ValenceUI/Icon';
import {
  Calendar01Icon,
  InformationCircleIcon,
  MoreHorizontalIcon,
  PlayIcon,
  StopIcon,
} from '@hugeicons/core-free-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { ClearLibraryPartsDialog } from '@ValenceScreens/components/AdminArea/components/ClearLibraryPartsDialog/ClearLibraryPartsDialog';
import { RunLibraryJobDialog } from '@ValenceScreens/components/AdminArea/components/RunLibraryJobDialog/RunLibraryJobDialog';
import { ScanProgressBar } from '@ValenceScreens/components/AdminArea/components/ScanProgressBar/ScanProgressBar';
import { describeQueueKind } from '@ValenceScreens/components/AdminArea/describeQueueKind';
import { summariseProgress } from './summariseProgress';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { JobRunnerProps } from './JobRunner.types';

const WORKING_SHOWN = 4;

/**
 * Every job the server knows how to do, each with what it is for, whether it is running now and how
 * far along, and a way to start or stop it by hand. Pressing into a job opens what makes it run on
 * its own, so the list stays a list rather than becoming a page of settings.
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

  const isBusyWithALibrary = definitions.some(
    (definition) => definition.needsLibrary && summaryFor(definition.kind) !== null,
  );

  const live = useRef({
    summaryFor,
    jobIdsFor,
    working,
    askOrRun,
    onStop,
    onOpenSchedule,
    isBusyWithALibrary,
  });

  live.current = {
    summaryFor,
    jobIdsFor,
    working,
    askOrRun,
    onStop,
    onOpenSchedule,
    isBusyWithALibrary,
  };

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
          <Badge size="sm" tone={row.original.needsLibrary ? 'quiet' : 'accent'}>
            {row.original.needsLibrary ? 'Libraries' : 'Server'}
          </Badge>
        ),
      },
      {
        id: 'state',
        header: 'State',
        enableSorting: false,
        cell: ({ row }) => {
          const summary = live.current.summaryFor(row.original.kind);

          if (summary === null) {
            return (
              <Badge size="sm" tone="quiet">
                Idle
              </Badge>
            );
          }

          const jobIds = live.current.jobIdsFor(row.original.kind);

          const onNow = live.current.working.filter(
            (job) =>
              job.state === 'running' &&
              job.correlationId !== null &&
              jobIds.has(job.correlationId),
          );

          return (
            <HoverCard
              side="left"
              align="center"
              detail={
                <div className="flex flex-col gap-3">
                  <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
                    {row.original.label}
                  </span>

                  <ScanProgressBar
                    label={row.original.label}
                    phase={summary.phase}
                    processed={summary.processed}
                    total={summary.total}
                  />

                  {onNow.length === 0 ? (
                    <p className="font-body text-xs text-text-muted">
                      Nothing in the transcoder's own queue is tied to this yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {onNow.slice(0, WORKING_SHOWN).map((job) => (
                        <li key={job.id} className="flex min-w-0 flex-col">
                          <span className="truncate text-xs text-text" title={job.subject}>
                            {job.subject}
                          </span>
                          <span className="text-xs text-text-muted">
                            {describeQueueKind(job.kind)}
                          </span>
                        </li>
                      ))}

                      {onNow.length <= WORKING_SHOWN ? null : (
                        <li className="font-body text-xs text-text-muted">
                          and {(onNow.length - WORKING_SHOWN).toString()} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              }
            >
              <Badge size="sm" tone="accent">
                Running
              </Badge>

              <Icon of={InformationCircleIcon} size={15} className="shrink-0 text-text-muted" />
            </HoverCard>
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
                      icon: <Icon of={PlayIcon} size={15} />,
                      isDestructive: row.original.destructive,
                      isDisabled:
                        row.original.needsLibrary &&
                        live.current.isBusyWithALibrary &&
                        live.current.summaryFor(row.original.kind) === null,
                      onChoose: () => {
                        live.current.askOrRun(row.original);
                      },
                    },
                    ...(live.current.summaryFor(row.original.kind) === null
                      ? []
                      : [
                          {
                            id: 'stop',
                            label: 'Stop it',
                            icon: <Icon of={StopIcon} size={15} />,
                            isDestructive: true,
                            onChoose: () => {
                              live.current.onStop(row.original.kind);
                            },
                          },
                        ]),
                    ...(row.original.takesParts
                      ? []
                      : [
                          {
                            id: 'schedule',
                            label: 'Edit schedule',
                            icon: <Icon of={Calendar01Icon} size={15} />,
                            onChoose: () => {
                              live.current.onOpenSchedule(row.original.kind);
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
    [],
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

      <Dialog
        label={confirming === null ? 'Run this job?' : `Run ${confirming.label}?`}
        isOpen={confirming !== null}
        onClose={() => {
          setConfirming(null);
        }}
      >
        {confirming === null ? null : (
          <>
            <DialogTitle title={`${confirming.label}?`} />

            <DialogContent>
              <p className="text-sm text-text-muted">
                {confirming.description} This cannot be undone.
              </p>
            </DialogContent>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirming(null);
                }}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                onClick={() => {
                  onRun(confirming.kind);
                  setConfirming(null);
                }}
              >
                {confirming.label}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </>
  );
};

JobRunner.displayName = 'JobRunner';

export { JobRunner };
