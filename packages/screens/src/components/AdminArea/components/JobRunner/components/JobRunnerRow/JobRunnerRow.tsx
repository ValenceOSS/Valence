import { sayAgain } from '@ValenceI18n/sayAgain';
import { Calendar as CalendarIcon, Info as InfoIcon } from '@keyline-icons/react';
import { Play as PlayFilledIcon, Stop as StopFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { describeTrigger } from '@ValenceClient/admin/describeTrigger';
import { describeCountdown } from '@ValenceScreens/components/AdminArea/components/JobRunner/describeCountdown';
import { ScanProgressBar } from '@ValenceScreens/components/AdminArea/components/ScanProgressBar/ScanProgressBar';
import type { JobTrigger } from '@ValenceClient/admin/fetchAdmin';
import type { JobRunnerRowProps } from './JobRunnerRow.types';
import { say } from '@ValenceI18n/say';

/**
 * Says when a job runs on its own in a few words: its first trigger, and how many more it has.
 *
 * @param triggers - What makes the job run on its own.
 * @returns The schedule to show on the row.
 */
const describeSchedule = (triggers: JobTrigger[]): string => {
  const [first, ...rest] = triggers;

  if (first === undefined) {
    return say('screens.jobRunner.jobRunnerRow.notScheduled');
  }

  const said = describeTrigger(first.trigger);

  return rest.length === 0 ? said : `${said} +${rest.length.toString()}`;
};

/**
 * One job on one line: what it is, how long until it next runs on its own, when it runs with a
 * button to change that, and a button to run or stop it now. A job that cannot be scheduled says it is run by hand only.
 * While it runs, its progress takes the place of its description, so a running job reads
 * differently from an idle one without a column of badges saying so.
 *
 * @param definition - The job.
 * @param triggers - What makes it run on its own.
 * @param nextRunAt - When it next runs on its own, or null where nothing will run it.
 * @param now - The moment to count down from.
 * @param summary - How far along it is, or null while it is not running.
 * @param isRunBlocked - Whether it has to wait for other work on a library before it can start.
 * @param onRun - Called to start it.
 * @param onStop - Called to stop it.
 * @param onWatch - Called to open what it is doing.
 * @param onOpenSchedule - Called with its kind to open its schedule.
 */
const JobRunnerRow = ({
  definition,
  triggers,
  nextRunAt,
  now,
  summary,
  isRunBlocked,
  onRun,
  onStop,
  onWatch,
  onOpenSchedule,
}: JobRunnerRowProps) => {
  const isRunning = summary !== null;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_6.5rem_11rem_6rem]">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          {isRunning ? (
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse"
            />
          ) : null}

          <span className="truncate text-sm font-medium text-text">
            {sayAgain(definition.label)}
          </span>
        </span>

        {summary === null ? (
          <span
            className="truncate text-xs text-text-muted"
            title={sayAgain(definition.description)}
          >
            {sayAgain(definition.description)}
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1">
            <ScanProgressBar
              label={sayAgain(definition.label)}
              phase={summary.phase}
              processed={summary.processed}
              total={summary.total}
              item={summary.item}
              isStopping={summary.isStopping}
            />

            <Button
              variant="subtle"
              size="none"
              isIconOnly
              label={say('screens.jobRunner.jobRunnerRow.whatLabelIsDoing', {
                label: sayAgain(definition.label),
              })}
              onClick={() => {
                onWatch(definition);
              }}
            >
              <Icon of={InfoIcon} size={14} />
            </Button>
          </span>
        )}
      </div>

      <span className="hidden text-right text-xs tabular-nums text-text-muted sm:block">
        {nextRunAt === null ? null : describeCountdown(nextRunAt - now)}
      </span>

      <span className="hidden min-w-0 justify-end sm:flex">
        {definition.schedulable ? (
          <Button
            variant="secondary"
            size="xs"
            className="w-full justify-start"
            label={say('screens.jobRunner.jobRunnerRow.editTheScheduleForLabel', {
              label: sayAgain(definition.label),
            })}
            onClick={() => {
              onOpenSchedule(definition.kind);
            }}
          >
            <Icon of={CalendarIcon} size={13} tone="muted" />
            <span
              className={cn(
                'truncate tabular-nums',
                triggers.length === 0 ? 'text-text-muted' : 'text-text',
              )}
            >
              {describeSchedule(triggers)}
            </span>
          </Button>
        ) : (
          <span className="truncate px-2 text-xs text-text-muted">
            {say('screens.jobRunner.jobRunnerRow.runByHandOnly')}
          </span>
        )}
      </span>

      <span className="flex justify-end">
        {isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            label={say('screens.jobRunner.jobRunnerRow.stopLabel', {
              label: sayAgain(definition.label),
            })}
            hasTooltip={false}
            disabled={summary.isStopping}
            onClick={() => {
              onStop(definition);
            }}
          >
            <Icon of={StopFilledIcon} size={13} />
            {summary.isStopping ? say('common.stopping2') : say('common.stop')}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            label={say('common.runLabel', { label: sayAgain(definition.label) })}
            hasTooltip={false}
            disabled={isRunBlocked}
            onClick={() => {
              onRun(definition);
            }}
          >
            <Icon of={PlayFilledIcon} size={13} />
            {say('common.run')}
          </Button>
        )}
      </span>
    </li>
  );
};

JobRunnerRow.displayName = 'JobRunnerRow';

export { JobRunnerRow };
