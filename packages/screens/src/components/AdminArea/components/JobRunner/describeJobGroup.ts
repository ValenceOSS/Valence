import type { JobGroup } from '@ValenceContracts/schemas/JobGroup';
import { say } from '@ValenceI18n/say';

const HEADINGS: Record<JobGroup, string> = {
  library: say('common.library'),
  requests: say('common.requests'),
  notifications: say('common.notifications'),
  health: say('screens.jobRunner.describeJobGroup.healthChecks'),
  housekeeping: say('screens.jobRunner.describeJobGroup.housekeeping'),
  reset: say('screens.jobRunner.describeJobGroup.reset'),
};

/**
 * Names a group of jobs for the heading over it.
 *
 * @param group - The group the server put the jobs in.
 * @returns The heading to show.
 */
const describeJobGroup = (group: JobGroup): string => HEADINGS[group];

export { describeJobGroup };
