import type { JobGroup } from '@ValenceContracts/schemas/JobGroup';

const HEADINGS: Record<JobGroup, string> = {
  library: 'Library',
  requests: 'Requests',
  notifications: 'Notifications',
  health: 'Health checks',
  housekeeping: 'Housekeeping',
  reset: 'Reset',
};

/**
 * Names a group of jobs for the heading over it.
 *
 * @param group - The group the server put the jobs in.
 * @returns The heading to show.
 */
const describeJobGroup = (group: JobGroup): string => HEADINGS[group];

export { describeJobGroup };
