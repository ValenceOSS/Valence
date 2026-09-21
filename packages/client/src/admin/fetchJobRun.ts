import { JobRunRecordSchema } from '@ValenceContracts/schemas/JobRun';
import type { JobRunRecord } from '@ValenceContracts/schemas/JobRun';

/**
 * Reads one job run, for a link that names a run which is not among the ones already on screen.
 *
 * @param jobRunId - Which run.
 * @returns The run, or nothing where it has been forgotten or could not be read.
 */
const fetchJobRun = async (jobRunId: string): Promise<JobRunRecord | null> => {
  const response = await fetch(`/api/admin/jobs/history/${encodeURIComponent(jobRunId)}`, {
    credentials: 'same-origin',
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = JobRunRecordSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : null;
};

export { fetchJobRun };
