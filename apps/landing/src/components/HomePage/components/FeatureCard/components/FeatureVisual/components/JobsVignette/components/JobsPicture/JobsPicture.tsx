import { PanelCard } from '@ValenceUI/PanelCard';
import { Well } from '@ValenceUI/Well';
import { JobRunnerRow } from '@ValenceScreens/components/AdminArea/components/JobRunner/components/JobRunnerRow/JobRunnerRow';
import type { JobDefinition, JobTrigger } from '@ValenceClient/admin/fetchAdmin';
import { ShowcaseScope } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseScope/ShowcaseScope';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';
import type { JobsPictureProps } from './JobsPicture.types';

const MINUTE = 60_000;

const HOUR = 60 * MINUTE;

const SHOWN_AT = Date.parse('2026-11-09T22:00:50.000Z');

type ShowcaseJob = {
  definition: JobDefinition;
  triggers: JobTrigger[];
  nextRunIn: number;
};

/**
 * A job the made-up server offers, as the server describes it.
 *
 * @param kind - Which job it is.
 * @param label - What it is called.
 * @param description - What it does.
 * @returns The job.
 */
const aJob = (
  kind: string,
  label: JobDefinition['label'],
  description: JobDefinition['description'],
): JobDefinition => ({
  kind,
  label,
  description,
  group: 'library',
  needsLibrary: true,
  destructive: false,
  takesParts: false,
  runsByHand: true,
  schedulable: true,
});

const JOBS: ShowcaseJob[] = [
  {
    definition: aJob(
      'library.scan',
      saying('common.scanForChanges'),
      saying('server.jobs.jobDefinitions.findsNewChangedAndRemovedFiles'),
    ),
    triggers: [{ id: 'nightly-scan', trigger: { kind: 'daily', hour: 3, minute: 0 } }],
    nextRunIn: 4 * HOUR + 59 * MINUTE,
  },
  {
    definition: aJob(
      'library.regenerateTrickplay',
      saying('server.jobs.jobDefinitions.generateMissingScrubPreviews'),
      saying('server.jobs.jobDefinitions.rendersSeekBarThumbnailsForItems'),
    ),
    triggers: [{ id: 'nightly-thumbnails', trigger: { kind: 'daily', hour: 4, minute: 0 } }],
    nextRunIn: 5 * HOUR + 59 * MINUTE,
  },
  {
    definition: {
      ...aJob(
        'maintenance.sweepArtefactCache',
        saying('server.jobs.jobDefinitions.cleanUpCachedPreviews'),
        saying('server.jobs.jobDefinitions.deletesPreviewClipsAndThumbnailsNothing'),
      ),
      group: 'housekeeping',
      needsLibrary: false,
    },
    triggers: [
      { id: 'weekly-sweep', trigger: { kind: 'weekly', dayOfWeek: 0, hour: 5, minute: 0 } },
    ],
    nextRunIn: 54 * HOUR + 59 * MINUTE,
  },
];

/**
 * The admin's jobs, drawn by the app's own job rows stacked for a narrow card: what each does, when
 * it next runs on its own, and a button to run it now; acted out, the scan runs.
 *
 * @param scan - How far along the scan is, or null while it is not running.
 * @param now - The moment the countdowns count down from.
 */
const JobsPicture = ({ scan = null, now = SHOWN_AT }: JobsPictureProps) => (
  <ShowcaseScope>
    <PanelCard title={say('common.jobs')} hasFace={false} className="w-full text-left">
      <Well isFlush>
        <ul className="flex flex-col">
          {JOBS.map((job, index) => (
            <JobRunnerRow
              key={job.definition.kind}
              definition={job.definition}
              triggers={job.triggers}
              nextRunAt={SHOWN_AT + job.nextRunIn}
              now={now}
              summary={index === 0 ? scan : null}
              isRunBlocked={false}
              isCompact
              onRun={nothing}
              onStop={nothing}
              onWatch={nothing}
              onOpenSchedule={nothing}
            />
          ))}
        </ul>
      </Well>
    </PanelCard>
  </ShowcaseScope>
);

JobsPicture.displayName = 'JobsPicture';

export { JobsPicture };
