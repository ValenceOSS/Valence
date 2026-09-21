import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ObservabilitySearchHost } from '@ValenceScreens/testing/ObservabilitySearchHost';
import { JobHistory } from './JobHistory';
import { fetchJobHistory, fetchJobHistoryIssues, watchJobs } from '@ValenceClient/admin/fetchAdmin';
import type { ReactElement } from 'react';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
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
    takesParts: false,
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

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(await screen.findByText('Generate missing previews')).toBeInTheDocument();
    expect(screen.queryByText('library.regeneratePreviews')).not.toBeInTheDocument();
  });

  it('puts the kind of a run into words where this page has no label for it', async () => {
    askedHistory.mockResolvedValue(page([record({ kind: 'catalogue.rematch' })]));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(await screen.findByText('Rematch')).toBeInTheDocument();
  });

  it('shows the subject, status and progress of a run', async () => {
    askedHistory.mockResolvedValue(page([record()]));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(await screen.findByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows why a run failed alongside its subject', async () => {
    askedHistory.mockResolvedValue(
      page([record({ status: 'failed', errorMessage: 'no such path' })]),
    );

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(await screen.findByText('no such path')).toBeInTheDocument();
  });

  it('says it is reading before the first page arrives', () => {
    askedHistory.mockReturnValue(new Promise(() => undefined));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(screen.getByText('Reading job history…')).toBeInTheDocument();
  });

  it('says nothing matches once a confirmed-empty page arrives', async () => {
    askedHistory.mockResolvedValue(page([]));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(await screen.findByText('No job runs match this.')).toBeInTheDocument();
  });

  it('says history could not be read when the request fails', async () => {
    askedHistory.mockRejectedValue(new Error('offline'));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

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

      renderHistory(
        <JobHistory
          search={{}}
          onSearchChange={vi.fn()}
          definitions={DEFINITIONS}
          libraries={[]}
          working={[]}
          onViewLogs={vi.fn()}
          onTrace={vi.fn()}
        />,
      );

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

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

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

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={onViewLogs}
        onTrace={vi.fn()}
      />,
    );

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

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(askedIssues).not.toHaveBeenCalled();

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));

    expect(
      await screen.findByText(/\/media\/movies\/broken\.mkv: ffmpeg exited with a non-zero status/),
    ).toBeInTheDocument();
    expect(askedIssues).toHaveBeenCalledWith('run-1');
  });

  it('says a run has no issues rather than showing an empty list', async () => {
    const actor = userEvent.setup();

    askedHistory.mockResolvedValue(page([record()]));
    askedIssues.mockResolvedValue([]);

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));

    expect(await screen.findByText('No issues were recorded for this run.')).toBeInTheDocument();
  });

  it('shows the whole failure of a run that failed outright, rather than saying it has no issues', async () => {
    const actor = userEvent.setup();
    const message =
      'Failed query: select "path", "sizeBytes" from "media_item" where "libraryId" = $1';

    askedHistory.mockResolvedValue(page([record({ status: 'failed', errorMessage: message })]));
    askedIssues.mockResolvedValue([]);

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText(message)).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText('No issues were recorded for this run.'),
    ).not.toBeInTheDocument();
  });

  it('lists the failure first and the itemised issues after it, where a run has both', async () => {
    const actor = userEvent.setup();

    askedHistory.mockResolvedValue(
      page([record({ status: 'failed', errorMessage: 'It stopped.' })]),
    );
    askedIssues.mockResolvedValue([issue()]);

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));

    const dialog = await screen.findByRole('dialog');

    expect(await within(dialog).findByText(/It stopped\./)).toBeInTheDocument();
    expect(within(dialog).getByText(/\/media\/movies\/broken\.mkv/)).toBeInTheDocument();
  });

  it('opens what a running run is made of from the i beside its status', async () => {
    const actor = userEvent.setup();

    askedHistory.mockResolvedValue(page([record({ status: 'running', finishedAtMs: null })]));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[
          {
            id: 1,
            kind: 'preview',
            subject: 'Movie.mkv',
            state: 'running',
            queuedAtMs: 0,
            startedAtMs: 0,
            finishedAtMs: null,
            correlationId: 'run-1',
            failure: null,
          },
          {
            id: 2,
            kind: 'preview',
            subject: 'Unrelated.mkv',
            state: 'running',
            queuedAtMs: 0,
            startedAtMs: 0,
            finishedAtMs: null,
            correlationId: 'run-2',
            failure: null,
          },
        ]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    await actor.click(
      await screen.findByRole('button', { name: 'What Generate missing previews is doing' }),
    );

    expect(await screen.findByText('Movie.mkv')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated.mkv')).not.toBeInTheDocument();
  });

  it('offers no i beside a run that is not running', async () => {
    askedHistory.mockResolvedValue(page([record()]));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    await screen.findByText('Done');

    expect(screen.queryByRole('button', { name: /is doing/ })).not.toBeInTheDocument();
  });

  it('shows a run against a library by the library name, not its identifier', async () => {
    const id = 'd3ecbc24-d083-4945-b2ab-000000000000';

    askedHistory.mockResolvedValue(page([record({ subject: id })]));

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[
          {
            id,
            name: 'Movies',
            kind: 'movies',
            path: '/media/movies',
            itemCount: 107,
            lastScannedAt: null,
            defaultAudioLanguage: null,
            filesAtOnce: null,
            takesRequests: true,
            requestProfileId: null,
            requestPath: null,
          },
        ]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    expect(await screen.findByText('Movies')).toBeInTheDocument();
    expect(screen.queryByText(id)).not.toBeInTheDocument();
  });

  it('copies everything that went wrong as plain text', async () => {
    const actor = userEvent.setup();
    const copied = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: copied } });

    askedHistory.mockResolvedValue(
      page([record({ status: 'failed', errorMessage: 'It stopped.' })]),
    );
    askedIssues.mockResolvedValue([issue()]);

    renderHistory(
      <JobHistory
        search={{}}
        onSearchChange={vi.fn()}
        definitions={DEFINITIONS}
        libraries={[]}
        working={[]}
        onViewLogs={vi.fn()}
        onTrace={vi.fn()}
      />,
    );

    await actor.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );
    await actor.click(await screen.findByRole('menuitem', { name: 'View issues' }));
    await screen.findByText(/broken\.mkv/);
    await actor.click(screen.getByRole('button', { name: 'Copy' }));

    expect(copied).toHaveBeenCalledWith(
      'It stopped.\n/media/movies/broken.mkv: ffmpeg exited with a non-zero status',
    );

    vi.unstubAllGlobals();
  });

  describe('finding a run', () => {
    const drawHistory = (onTrace = vi.fn(), initial: ObservabilitySearch = {}) =>
      renderHistory(
        <ObservabilitySearchHost initial={initial}>
          {(search, update) => (
            <JobHistory
              definitions={DEFINITIONS}
              libraries={[]}
              working={[]}
              search={search}
              onSearchChange={update}
              onViewLogs={vi.fn()}
              onTrace={onTrace}
            />
          )}
        </ObservabilitySearchHost>,
      );

    it('asks for the last day, newest first, with nothing filtered, to begin with', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory();
      await screen.findByText('Generate missing previews');

      const asked = askedHistory.mock.calls.at(-1)?.[0];

      expect(asked).toMatchObject({ sort: 'newest', search: '', kind: null, status: null });
      expect(asked?.sinceMs ?? 0).toBeGreaterThan(Date.now() - 1.1 * 86_400_000);
    });

    it('lets the server search, by job, library, error or run id', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory();
      await screen.findByText('Generate missing previews');
      await userEvent.type(screen.getByRole('searchbox', { name: 'Search job runs' }), 'run-9');

      await waitFor(() => {
        expect(askedHistory.mock.calls.at(-1)?.[0]).toMatchObject({ search: 'run-9' });
      });
    });

    it('lets the server filter by status and by job', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory();
      await screen.findByText('Generate missing previews');
      await userEvent.click(screen.getByRole('button', { name: 'Filter job runs' }));
      await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Failed' }));

      await waitFor(() => {
        expect(askedHistory.mock.calls.at(-1)?.[0]).toMatchObject({ status: 'failed' });
      });
    });

    it('shares the kind of job with the log, through the address', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory(vi.fn(), { q: 'kind:library.regeneratePreviews' });
      await screen.findByText('Generate missing previews');

      expect(askedHistory.mock.calls.at(-1)?.[0]).toMatchObject({
        kind: 'library.regeneratePreviews',
      });
    });

    it('asks for a stretch zoomed to on the log', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory(vi.fn(), { range: 'all', from: 1000, until: 9000 });
      await screen.findByText('Generate missing previews');

      expect(askedHistory.mock.calls.at(-1)?.[0]).toMatchObject({ sinceMs: 1000, untilMs: 9000 });
    });

    it('reads everything kept where the range chosen has no start', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory(vi.fn(), { range: 'all' });
      await screen.findByText('Generate missing previews');

      expect(askedHistory.mock.calls.at(-1)?.[0]).toMatchObject({ sinceMs: null });
    });

    it('changes the order', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory();
      await screen.findByText('Generate missing previews');
      await userEvent.click(screen.getByRole('button', { name: 'Order' }));
      await userEvent.click(await screen.findByRole('menuitemradio', { name: /Longest first/ }));

      await waitFor(() => {
        expect(askedHistory.mock.calls.at(-1)?.[0]).toMatchObject({ sort: 'longest' });
      });
    });

    it('counts the runs in view by how they ended', async () => {
      askedHistory.mockResolvedValue(
        page([
          record({ id: 'a', status: 'running' }),
          record({ id: 'b', status: 'completed' }),
          record({ id: 'c', status: 'completed' }),
          record({ id: 'd', status: 'failed' }),
        ]),
      );

      drawHistory();

      const strip = await screen.findByLabelText('How the job runs stand');

      await waitFor(() => {
        expect(within(strip).getByText('Completed').nextElementSibling).toHaveTextContent('2');
      });
      expect(within(strip).getByText('Running now').nextElementSibling).toHaveTextContent('1');
      expect(within(strip).getByText('Failed').nextElementSibling).toHaveTextContent('1');
    });

    it('says how long a finished run took', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      drawHistory();

      expect(await screen.findByText('took 5 s')).toBeInTheDocument();
    });

    it('draws how far a run got as a bar, not only as numbers', async () => {
      askedHistory.mockResolvedValue(page([record({ status: 'running', finishedAtMs: null })]));

      drawHistory();

      expect(
        await screen.findByRole('progressbar', { name: 'Generate missing previews progress' }),
      ).toBeInTheDocument();
    });

    it('traces a run from its menu', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      const onTrace = vi.fn();

      drawHistory(onTrace);
      await userEvent.click(
        await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
      );
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Trace this run' }));

      expect(onTrace).toHaveBeenCalledWith('run-1');
    });

    it('traces a run when its row is chosen', async () => {
      askedHistory.mockResolvedValue(page([record()]));

      const onTrace = vi.fn();

      drawHistory(onTrace);
      await userEvent.click(await screen.findByText('Generate missing previews'));

      expect(onTrace).toHaveBeenCalledWith('run-1');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobHistory.displayName).toBe('JobHistory');
  });
});
