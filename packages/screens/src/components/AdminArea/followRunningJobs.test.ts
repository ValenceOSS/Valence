import { beforeEach, describe, expect, it, vi } from 'vitest';
import { followRunningJobs } from './followRunningJobs';
import type { JobEvent } from '@ValenceContracts/schemas/JobRun';

const resumeRunningMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const watchJobsMock = vi.hoisted(() =>
  vi.fn<(onEvent: (event: JobEvent) => void) => () => void>(() => () => {}),
);

vi.mock('@ValenceScreens/components/AdminArea/scanCoordinator', () => ({
  resumeRunning: resumeRunningMock,
}));

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  watchJobs: watchJobsMock,
}));

beforeEach(() => {
  resumeRunningMock.mockClear();
  watchJobsMock.mockReset();
  watchJobsMock.mockReturnValue(() => {});
});

const started = (): JobEvent => ({
  event: 'started',
  kind: 'library.regeneratePreviews',
  jobId: 'job-1',
  subject: 'library-1',
});

describe('followRunningJobs', () => {
  it('adopts what is already running when it starts', () => {
    followRunningJobs();

    expect(resumeRunningMock).toHaveBeenCalledTimes(1);
  });

  it('adopts a job the server starts on its own', () => {
    followRunningJobs();

    const onEvent = watchJobsMock.mock.calls[0]?.[0] ?? (() => {});

    onEvent(started());

    expect(resumeRunningMock).toHaveBeenCalledTimes(2);
  });

  it('does not look again for progress or for a job that has ended', () => {
    followRunningJobs();

    const onEvent = watchJobsMock.mock.calls[0]?.[0] ?? (() => {});

    onEvent({
      event: 'progress',
      jobId: 'job-1',
      phase: 'previews',
      processed: 1,
      total: 4,
    });
    onEvent({
      event: 'completed',
      kind: 'library.regeneratePreviews',
      label: 'Generate missing previews',
      jobId: 'job-1',
      subject: 'library-1',
      subjectName: 'Movies',
    });

    expect(resumeRunningMock).toHaveBeenCalledTimes(1);
  });

  it('stops watching when told to', () => {
    const unwatch = vi.fn();

    watchJobsMock.mockReturnValue(unwatch);

    followRunningJobs()();

    expect(unwatch).toHaveBeenCalledTimes(1);
  });
});
