import type { JobRunIssue } from '@ValenceContracts/schemas/JobRun';

/**
 * Writes out everything that went wrong in a run as plain text, the run's own failure first and then
 * each file it could not do, one to a line — the form somebody pastes into a report.
 *
 * @param failure - Why the run failed outright, or null where it did not.
 * @param issues - The files it could not do.
 * @returns The text, which is empty where nothing went wrong.
 */
const describeRunIssues = (failure: string | null, issues: readonly JobRunIssue[]): string =>
  [
    ...(failure === null ? [] : [failure]),
    ...issues.map((issue) => `${issue.path}: ${issue.reason}`),
  ].join('\n');

export { describeRunIssues };
