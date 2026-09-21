import { JobStatsSchema } from '@ValenceContracts/schemas/JobRun';
import type { JobStats } from '@ValenceContracts/schemas/JobRun';

/**
 * Reads how each kind of job has gone since a moment: how many runs, how they ended, how long the
 * typical one took and the slowest.
 *
 * @param sinceMs - The earliest a counted run was created, or nothing for the last week.
 * @returns The summary, with no kinds where the server could not say.
 */
const fetchJobStats = async (sinceMs?: number): Promise<JobStats> => {
  const asked = sinceMs === undefined ? '' : `?sinceMs=${sinceMs.toString()}`;
  const response = await fetch(`/api/admin/jobs/stats${asked}`, {
    credentials: 'same-origin',
  }).catch(() => null);
  const nothing: JobStats = { sinceMs: sinceMs ?? 0, kinds: [] };

  if (response === null || !response.ok) {
    return nothing;
  }

  const read = JobStatsSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : nothing;
};

export { fetchJobStats };
