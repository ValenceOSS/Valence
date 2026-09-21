import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchJobHistoryIssues } from '@ValenceClient/admin/fetchAdmin';
import { fetchJobRun } from '@ValenceClient/admin/fetchJobRun';
import { fetchLogHistogram } from '@ValenceClient/admin/fetchLogHistogram';
import { fetchLogs } from '@ValenceClient/admin/fetchLogs';
import { JobTraceDialog } from './JobTraceDialog';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { JobRunRecord } from '@ValenceContracts/schemas/JobRun';
import type { LogRecord } from '@ValenceContracts/schemas/Log';
import type { JobTraceDialogProps } from './JobTraceDialog.types';

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  fetchJobHistoryIssues: vi.fn(),
}));
vi.mock('@ValenceClient/admin/fetchJobRun', () => ({ fetchJobRun: vi.fn() }));
vi.mock('@ValenceClient/admin/fetchLogs', () => ({ fetchLogs: vi.fn(), watchLogs: vi.fn() }));
vi.mock('@ValenceClient/admin/fetchLogHistogram', () => ({ fetchLogHistogram: vi.fn() }));

const DEFINITIONS: JobDefinition[] = [
  {
    kind: 'library.scan',
    label: 'Scan for changes',
    description: 'Looks for new files.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
  },
];

const START = 1_700_000_000_000;

const run = (over: Partial<JobRunRecord> = {}): JobRunRecord => ({
  id: 'run-1',
  kind: 'library.scan',
  status: 'completed',
  subject: null,
  startedAtMs: START,
  finishedAtMs: START + 125_000,
  progress: { phase: 'files', processed: 40, total: 50 },
  errorMessage: null,
  createdAtMs: START,
  ...over,
});

const line = (id: string, offsetMs: number, over: Partial<LogRecord> = {}): LogRecord => ({
  id,
  atMs: START + offsetMs,
  level: 'info',
  source: 'scanner',
  message: `Line ${id}`,
  detail: null,
  count: 1,
  context: {
    jobId: 'run-1',
    jobKind: 'library.scan',
    libraryId: null,
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
  ...over,
});

const draw = (over: Partial<JobTraceDialogProps> = {}) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <JobTraceDialog
        jobRunId="run-1"
        definitions={DEFINITIONS}
        onClose={vi.fn()}
        onOpenInLogs={vi.fn()}
        copy={() => Promise.resolve()}
        {...over}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.mocked(fetchJobRun).mockResolvedValue(run());
  vi.mocked(fetchLogs).mockResolvedValue({
    records: [line('a', 400), line('b', 65_000, { level: 'error', message: 'Could not read it' })],
    total: 2,
  });
  vi.mocked(fetchLogHistogram).mockResolvedValue({
    fromMs: START,
    untilMs: START + 125_000,
    bucketMs: 5000,
    buckets: [{ atMs: START, debug: 0, info: 1, warn: 0, error: 1 }],
  });
  vi.mocked(fetchJobHistoryIssues).mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('JobTraceDialog', () => {
  it('names the job in words, and says which run it is', async () => {
    draw();

    expect(await screen.findByText('Scan for changes')).toBeInTheDocument();
    expect(screen.getByText('Run run-1')).toBeInTheDocument();
  });

  it('says how it ended and how long it took', async () => {
    draw();

    expect((await screen.findByText('Took')).nextElementSibling).toHaveTextContent('2 min 5 s');
  });

  it('says how far it got', async () => {
    draw();

    expect(
      (await screen.findByRole('progressbar', { name: 'Scan for changes progress' })).parentElement,
    ).toHaveTextContent('Files · 40 of 50');
  });

  it('reads what it logged in order, each line with how long after the start', async () => {
    draw();

    const lines = await screen.findByRole('list', { name: 'What this run logged, in order' });

    expect(lines).toHaveTextContent('+400 ms');
    expect(lines).toHaveTextContent('+1 min 5 s');
    expect(lines).toHaveTextContent('Could not read it');
  });

  it('asks for the lines of this run alone, oldest first', async () => {
    draw();
    await screen.findByText('Line a');

    expect(vi.mocked(fetchLogs).mock.calls[0]?.[0]).toMatchObject({
      jobId: 'run-1',
      sort: 'oldest',
    });
  });

  describe('while the run is still going', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('keeps reading what it logs, and how far it has got', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fetchJobRun)
        .mockResolvedValueOnce(
          run({
            status: 'running',
            finishedAtMs: null,
            progress: { phase: 'files', processed: 1, total: 50 },
          }),
        )
        .mockResolvedValue(
          run({
            status: 'running',
            finishedAtMs: null,
            progress: { phase: 'files', processed: 30, total: 50 },
          }),
        );
      vi.mocked(fetchLogs)
        .mockResolvedValueOnce({ records: [line('a', 400)], total: 1 })
        .mockResolvedValue({
          records: [line('a', 400), line('c', 3000, { message: 'Read another folder' })],
          total: 2,
        });
      draw();

      expect(await screen.findByText('Line a')).toBeInTheDocument();
      expect(screen.queryByText('Read another folder')).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(2100);

      expect(await screen.findByText('Read another folder')).toBeInTheDocument();
      expect(
        (await screen.findByRole('progressbar', { name: 'Scan for changes progress' }))
          .parentElement,
      ).toHaveTextContent('Files · 30 of 50');
    });

    it('stops asking once it has finished', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      draw();

      expect(await screen.findByText('Line a')).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(6000);

      expect(fetchLogs).toHaveBeenCalledTimes(1);
      expect(fetchJobRun).toHaveBeenCalledTimes(1);
    });
  });

  it('says how it failed', async () => {
    vi.mocked(fetchJobRun).mockResolvedValue(
      run({ status: 'failed', errorMessage: 'no such encoder' }),
    );

    draw();

    expect(await screen.findByText('no such encoder')).toBeInTheDocument();
    expect(screen.getByText('How it failed')).toBeInTheDocument();
  });

  it('says how many issues were recorded', async () => {
    vi.mocked(fetchJobHistoryIssues).mockResolvedValue([
      { id: 'i1', jobRunId: 'run-1', path: '/a', reason: 'bad', atMs: 1 },
      { id: 'i2', jobRunId: 'run-1', path: '/b', reason: 'bad', atMs: 2 },
    ]);

    draw();

    expect(await screen.findByText('2 issues were recorded')).toBeInTheDocument();
  });

  it('says so when the run has been forgotten, and still offers what it logged', async () => {
    vi.mocked(fetchJobRun).mockResolvedValue(null);

    draw();

    expect(await screen.findByText('This run is no longer in the history')).toBeInTheDocument();
    expect(await screen.findByText('Line a')).toBeInTheDocument();
  });

  it('says so when it logged nothing', async () => {
    vi.mocked(fetchLogs).mockResolvedValue({ records: [], total: 0 });

    draw();

    expect(
      await screen.findByText('This run logged nothing, or what it logged has been forgotten.'),
    ).toBeInTheDocument();
  });

  it('opens the run in the log', async () => {
    const onOpenInLogs = vi.fn();

    draw({ onOpenInLogs });
    await userEvent.click(await screen.findByRole('button', { name: 'Open in the log' }));

    expect(onOpenInLogs).toHaveBeenCalledWith('run-1');
  });

  it('copies the trace', async () => {
    const copy = vi.fn(() => Promise.resolve());

    draw({ copy });
    await screen.findByText('Line a');
    await userEvent.click(screen.getByRole('button', { name: 'Copy trace' }));

    expect(copy).toHaveBeenCalledWith(expect.stringContaining('Could not read it'));
  });

  it('is closed, and asks nothing, where no run is named', () => {
    draw({ jobRunId: null });

    expect(screen.queryByText('Scan for changes')).not.toBeInTheDocument();
    expect(fetchJobRun).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobTraceDialog.displayName).toBe('JobTraceDialog');
  });
});
