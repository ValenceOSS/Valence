import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JobHistory } from './JobHistory';
import { fetchJobHistory, fetchJobHistoryIssues, watchJobs } from '@ValenceClient/admin/fetchAdmin';
import type { ReactElement } from 'react';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type {
  JobEvent,
  JobRunIssue,
  JobRunPage,
  JobRunRecord,
} from '@ValenceContracts/schemas/JobRun';

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  watchJobs: vi.fn(() => () => {}),
  fetchJobHistory: vi.fn(),
  fetchJobHistoryIssues: vi.fn(),
}));

const askedHistory = vi.mocked(fetchJobHistory);
const askedIssues = vi.mocked(fetchJobHistoryIssues);
const watching = vi.mocked(watchJobs);

const STARTED_EVENT: JobEvent = {
  event: 'started',
  kind: 'library.regeneratePreviews',
  jobId: 'run-1',
  subject: 'Movies',
};

const DEFINITIONS: JobDefinition[] = [
  {
    kind: 'library.regeneratePreviews',
    label: 'Generate missing previews',
    description: 'Renders preview clips for items that have none.',
    needsLibrary: true,
    destructive: false,
  },
];

const record = (overrides: Partial<JobRunRecord> = {}): JobRunRecord => ({
  id: 'run-1',
  kind: 'library.regeneratePreviews',
  status: 'completed',
  subject: 'Movies',
  startedAtMs: 1_700_000_000_000,
  finishedAtMs: 1_700_000_005_000,
  progress: { phase: 'previews', processed: 4, total: 10 },
  errorMessage: null,
  createdAtMs: 1_700_000_000_000,
  ...overrides,
});

const page = (records: JobRunRecord[]): JobRunPage => ({ records, total: records.length });

const issue = (overrides: Partial<JobRunIssue> = {}): JobRunIssue => ({
  id: 'issue-1',
  jobRunId: 'run-1',
  path: '/media/movies/broken.mkv',
  reason: 'ffmpeg exited with a non-zero status',
  atMs: 1_700_000_001_000,
  ...overrides,
});

const renderHistory = (element: ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      {element}
    </QueryClientProvider>,
  );

describe('JobHistory', () => {
  it('names a run by the label the server offers, not its raw kind', async () => {
    askedHistory.mockResolvedValue(page([record()]));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(await screen.findByText('Generate missing previews')).toBeInTheDocument();
    expect(screen.queryByText('library.regeneratePreviews')).not.toBeInTheDocument();
  });

  it('falls back to the raw kind for a run this page has no label for', async () => {
    askedHistory.mockResolvedValue(page([record({ kind: 'catalogue.rematch' })]));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(await screen.findByText('catalogue.rematch')).toBeInTheDocument();
  });

  it('shows the subject, status and progress of a run', async () => {
    askedHistory.mockResolvedValue(page([record()]));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(await screen.findByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('previews 4/10')).toBeInTheDocument();
  });

  it('shows why a run failed alongside its subject', async () => {
    askedHistory.mockResolvedValue(
      page([record({ status: 'failed', errorMessage: 'no such path' })]),
    );

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(await screen.findByText('no such path')).toBeInTheDocument();
  });

  it('says it is reading before the first page arrives', () => {
    askedHistory.mockReturnValue(new Promise(() => undefined));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(screen.getByText('Reading job history…')).toBeInTheDocument();
  });

  it('says nothing matches once a confirmed-empty page arrives', async () => {
    askedHistory.mockResolvedValue(page([]));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(await screen.findByText('No job runs match this.')).toBeInTheDocument();
  });

  it('says history could not be read when the request fails', async () => {
    askedHistory.mockRejectedValue(new Error('offline'));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(
      await screen.findByText('Job history could not be read from the server.'),
    ).toBeInTheDocument();
  });

  it('coalesces a burst of job events into one refresh, not one per event', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    try {
      let onEvent: ((event: JobEvent) => void) | undefined;

      watching.mockImplementation((handler) => {
        onEvent = handler;

        return () => {};
      });

      askedHistory.mockResolvedValue(page([record()]));

      renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

      await screen.findByText('Movies');
      askedHistory.mockClear();

      onEvent?.(STARTED_EVENT);
      onEvent?.(STARTED_EVENT);
      onEvent?.(STARTED_EVENT);

      await vi.advanceTimersByTimeAsync(1_000);

      expect(askedHistory).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('filters by status when a status is chosen', async () => {
    const actor = userEvent.setup();

    askedHistory.mockResolvedValue(
      page([record(), record({ id: 'run-2', status: 'failed', subject: 'Shows' })]),
    );

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    await screen.findByText('Movies');
    await screen.findByText('Shows');

    await actor.click(screen.getByRole('button', { name: 'Filter by status' }));
    await actor.click(await screen.findByRole('menuitemradio', { name: 'Failed' }));

    await waitFor(() => {
      expect(screen.queryByText('Movies')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Shows')).toBeInTheDocument();
  });

  it('opens the log filtered to a run when View logs is chosen', async () => {
    const actor = userEvent.setup();
    const onViewLogs = vi.fn();

    askedHistory.mockResolvedValue(page([record()]));

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={onViewLogs} />);

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View logs' }));

    expect(onViewLogs).toHaveBeenCalledWith('run-1');
  });

  it('lazily reads a run’s issues only once asked for them', async () => {
    const actor = userEvent.setup();

    askedHistory.mockResolvedValue(page([record()]));
    askedIssues.mockResolvedValue([issue()]);

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    expect(askedIssues).not.toHaveBeenCalled();

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));

    expect(await screen.findByText('/media/movies/broken.mkv')).toBeInTheDocument();
    expect(screen.getByText('ffmpeg exited with a non-zero status')).toBeInTheDocument();
    expect(askedIssues).toHaveBeenCalledWith('run-1');
  });

  it('says a run has no issues rather than showing an empty list', async () => {
    const actor = userEvent.setup();

    askedHistory.mockResolvedValue(page([record()]));
    askedIssues.mockResolvedValue([]);

    renderHistory(<JobHistory definitions={DEFINITIONS} onViewLogs={vi.fn()} />);

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));

    expect(await screen.findByText('No issues were recorded for this run.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobHistory.displayName).toBe('JobHistory');
  });
});
