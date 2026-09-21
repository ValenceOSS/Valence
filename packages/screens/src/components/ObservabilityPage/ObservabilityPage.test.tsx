import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setQueuePaused } from '@ValenceClient/admin/fetchAdmin';
import { fetchJobRun } from '@ValenceClient/admin/fetchJobRun';
import { fetchJobStats } from '@ValenceClient/admin/fetchJobStats';
import { fetchLogFacets } from '@ValenceClient/admin/fetchLogFacets';
import { fetchLogHistogram } from '@ValenceClient/admin/fetchLogHistogram';
import { fetchLogs } from '@ValenceClient/admin/fetchLogs';
import { ObservabilityPage } from './ObservabilityPage';
import type { ReactElement } from 'react';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type { Job, JobDefinition, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { ObservabilityPageProps } from './ObservabilityPage.types';

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  watchJobs: vi.fn(() => () => {}),
  fetchJobHistory: vi.fn().mockResolvedValue({
    records: [
      {
        id: 'run-1',
        kind: 'library.scan',
        status: 'failed',
        subject: null,
        startedAtMs: 1_700_000_000_000,
        finishedAtMs: 1_700_000_005_000,
        progress: null,
        errorMessage: 'no such encoder',
        createdAtMs: 1_700_000_000_000,
      },
    ],
    total: 1,
  }),
  fetchJobHistoryIssues: vi.fn().mockResolvedValue([]),
  setQueuePaused: vi.fn().mockResolvedValue(true),
  setQueueConcurrency: vi.fn().mockResolvedValue(true),
}));
vi.mock('@ValenceClient/admin/fetchLogs', () => ({
  fetchLogs: vi.fn().mockResolvedValue({ records: [], total: 0 }),
  watchLogs: vi.fn(),
}));
vi.mock('@ValenceClient/admin/fetchLogHistogram', () => ({
  fetchLogHistogram: vi
    .fn()
    .mockResolvedValue({ fromMs: 0, untilMs: 1, bucketMs: 1000, buckets: [] }),
}));
vi.mock('@ValenceClient/admin/fetchLogFacets', () => ({
  fetchLogFacets: vi.fn().mockResolvedValue({ sources: [], jobKinds: [] }),
}));
vi.mock('@ValenceClient/admin/fetchJobStats', () => ({
  fetchJobStats: vi.fn().mockResolvedValue({ sinceMs: 0, kinds: [] }),
}));
vi.mock('@ValenceClient/admin/fetchJobRun', () => ({
  fetchJobRun: vi.fn().mockResolvedValue(null),
}));

const definition: JobDefinition = {
  kind: 'library.scan',
  label: 'Scan for changes',
  description: 'Looks for new and changed files.',
  needsLibrary: true,
  destructive: false,
  takesParts: false,
};

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  kind: 'library.scan',
  subject: 'Films',
  state: 'running',
  queuedAtMs: 0,
  correlationId: null,
  failure: null,
  startedAtMs: null,
  finishedAtMs: null,
  ...overrides,
});

const reading = (jobs: Job[], queue: Partial<Monitor['queue']> = {}): Monitor => ({
  resources: {
    atMs: 0,
    systemCpuPercent: 0,
    systemMemoryUsedBytes: 0,
    systemMemoryTotalBytes: 0,
    cpuCount: 1,
    serviceCpuPercent: 0,
    serviceMemoryBytes: 0,
    children: [],
    deploymentMemory: null,
    apiMemoryBytes: null,
    loadAverage: 0,
    disks: [],
    graphics: null,
    graphicsNotes: [],
    artefacts: null,
  },
  queue: { concurrency: 2, paused: false, queued: 0, running: jobs.length, jobs, ...queue },
  sessions: 0,
  logs: [],
  cache: null,
});

const props: ObservabilityPageProps = {
  definitions: [definition],
  libraries: [],
  progress: new Map(),
  monitor: null,
  viewingJobKind: null,
  schedules: new Map(),
  onRun: vi.fn(),
  onStop: vi.fn(),
  onOpenSchedule: vi.fn(),
  onCloseSchedule: vi.fn(),
  onAddTrigger: vi.fn(),
  onRemoveTrigger: vi.fn(),
};

const renderPage = (element: ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      {element}
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ObservabilityPage', () => {
  it('opens on the jobs, under a heading that says it is jobs and logs together', async () => {
    renderPage(<ObservabilityPage {...props} />);

    expect(screen.getByRole('heading', { name: 'Jobs & logs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Jobs', selected: true })).toBeInTheDocument();
    expect(await screen.findByText('no such encoder')).toBeInTheDocument();
  });

  it('lists the jobs first and the logs second', () => {
    renderPage(<ObservabilityPage {...props} />);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toStrictEqual([
      'Jobs',
      'Logs',
      'Health',
      'Run & schedule',
    ]);
  });

  it('opens on the log where the address says so', async () => {
    renderPage(<ObservabilityPage {...props} search={{ view: 'logs' }} />);

    expect(screen.getByRole('tab', { name: 'Logs', selected: true })).toBeInTheDocument();
    expect(await screen.findByText('No log lines match this')).toBeInTheDocument();
  });

  it('writes the view opened into the address, leaving it bare for the jobs', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();

    renderPage(<ObservabilityPage {...props} onSearchChange={onSearchChange} />);
    await user.click(screen.getByRole('tab', { name: 'Health' }));

    expect(onSearchChange).toHaveBeenLastCalledWith({ view: 'health' });

    await user.click(screen.getByRole('tab', { name: 'Jobs' }));

    expect(onSearchChange).toHaveBeenLastCalledWith({ view: undefined });
  });

  it('keeps the range chosen on one view when another is opened', async () => {
    const user = userEvent.setup();

    renderPage(<ObservabilityPage {...props} />);
    await user.click(await screen.findByRole('button', { name: 'Time range' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Everything kept' }));
    await user.click(screen.getByRole('tab', { name: 'Logs' }));

    expect(await screen.findByRole('button', { name: 'Time range' })).toHaveTextContent(
      'Everything kept',
    );
    await vi.waitFor(() => {
      expect(vi.mocked(fetchLogs).mock.calls.at(-1)?.[0]).toMatchObject({ sinceMs: null });
    });

    await user.click(screen.getByRole('tab', { name: 'Health' }));

    expect(await screen.findByRole('button', { name: 'Time range' })).toHaveTextContent(
      'Everything kept',
    );
  });

  it('opens on the view an address asked for', async () => {
    renderPage(<ObservabilityPage {...props} search={{ view: 'health' }} />);

    expect(screen.getByRole('tab', { name: 'Health', selected: true })).toBeInTheDocument();
    await screen.findByText('No job has run in this time.');
    expect(fetchJobStats).toHaveBeenCalled();
  });

  it('has the four views, and moves between them', async () => {
    const user = userEvent.setup();

    renderPage(<ObservabilityPage {...props} />);

    for (const name of ['Jobs', 'Logs', 'Health', 'Run & schedule']) {
      await user.click(screen.getByRole('tab', { name }));

      expect(screen.getByRole('tab', { name, selected: true })).toBeInTheDocument();
    }

    expect(await screen.findByText('Scan for changes')).toBeInTheDocument();
  });

  it('says nothing about the queue before a reading has arrived', () => {
    renderPage(<ObservabilityPage {...props} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('summarises the queue rather than making somebody count', () => {
    renderPage(
      <ObservabilityPage {...props} monitor={reading([job()], { queued: 3, running: 1 })} />,
    );

    expect(screen.getByText('1 running').parentElement).toHaveTextContent('1 running · 3 waiting');
    expect(screen.getByRole('button', { name: 'How many jobs run at once' })).toHaveTextContent(
      '2 at a time',
    );
  });

  it('keeps the queue in reach from whichever view is open', async () => {
    const user = userEvent.setup();

    renderPage(<ObservabilityPage {...props} monitor={reading([job()])} />);
    await user.click(screen.getByRole('tab', { name: 'Health' }));

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('offers to pause the queue, and asks for it', async () => {
    renderPage(<ObservabilityPage {...props} monitor={reading([job()])} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Pause' }));

    expect(setQueuePaused).toHaveBeenCalledWith(true);
  });

  it('says the queue is paused, and offers to resume it instead', async () => {
    renderPage(<ObservabilityPage {...props} monitor={reading([job()], { paused: true })} />);

    expect(screen.getByText('Paused')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Resume' }));

    expect(setQueuePaused).toHaveBeenCalledWith(false);
  });

  it('mentions failures only when there are some', () => {
    renderPage(<ObservabilityPage {...props} monitor={reading([job()])} />);

    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
  });

  it('counts failures into the summary when there are', () => {
    renderPage(<ObservabilityPage {...props} monitor={reading([job({ state: 'failed' })])} />);

    expect(screen.getByText(/1 failed/)).toBeInTheDocument();
  });

  it('opens a schedule over the page rather than taking its place', () => {
    renderPage(<ObservabilityPage {...props} viewingJobKind="library.scan" />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('stays shut for a job kind it does not know', () => {
    renderPage(<ObservabilityPage {...props} viewingJobKind="library.summon" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('traces a run from the job runs, and opens it in the log from there', async () => {
    const user = userEvent.setup();

    vi.mocked(fetchJobRun).mockResolvedValue({
      id: 'run-1',
      kind: 'library.scan',
      status: 'failed',
      subject: null,
      startedAtMs: 1_700_000_000_000,
      finishedAtMs: 1_700_000_005_000,
      progress: null,
      errorMessage: 'no such encoder',
      createdAtMs: 1_700_000_000_000,
    });

    renderPage(<ObservabilityPage {...props} />);
    await user.click(await screen.findByText('no such encoder'));

    expect(await screen.findByText('Run run-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open in the log' }));

    expect(screen.getByRole('tab', { name: 'Logs', selected: true })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(vi.mocked(fetchLogs).mock.calls.at(-1)?.[0]).toMatchObject({ jobId: 'run-1' });
    });
    expect(fetchLogHistogram).toHaveBeenCalled();
    expect(fetchLogFacets).toHaveBeenCalled();
  });

  it('is one card, with no card inside it', async () => {
    const { container } = renderPage(<ObservabilityPage {...props} />);

    await screen.findByText('no such encoder');

    expect(container.querySelectorAll('.valence-card-shell')).toHaveLength(1);
    expect(container.querySelectorAll('.valence-card-face')).toHaveLength(1);
  });

  it('has no blue button anywhere on it', async () => {
    const { container } = renderPage(<ObservabilityPage {...props} />);

    await screen.findByText('no such encoder');

    expect(
      container.querySelectorAll('button.bg-accent, button[class*="bg-accent/"]'),
    ).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ObservabilityPage.displayName).toBe('ObservabilityPage');
  });
});
