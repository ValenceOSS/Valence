import { describe, expect, it } from 'vitest';
import { describeRunIssues } from './describeRunIssues';
import type { JobRunIssue } from '@ValenceContracts/schemas/JobRun';

const issue = (path: string, reason: string): JobRunIssue => ({
  id: path,
  jobRunId: 'run-1',
  path,
  reason,
  atMs: 0,
});

describe('describeRunIssues', () => {
  it('puts the failure first and each file after it on its own line', () => {
    expect(
      describeRunIssues('It stopped.', [issue('/a.mkv', 'bad'), issue('/b.mkv', 'worse')]),
    ).toBe('It stopped.\n/a.mkv: bad\n/b.mkv: worse');
  });

  it('writes only the files where the run did not fail outright', () => {
    expect(describeRunIssues(null, [issue('/a.mkv', 'bad')])).toBe('/a.mkv: bad');
  });

  it('is empty where nothing went wrong', () => {
    expect(describeRunIssues(null, [])).toBe('');
  });
});
