import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JobsPanel } from './JobsPanel';
import type { ReactElement } from 'react';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type { Job, JobDefinition, Monitor } from '@ValenceClient/admin/fetchAdmin';

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  watchJobs: vi.fn(() => () => {}),
  fetchJobHistory: vi.fn().mockResolvedValue({ records: [], total: 0 }),
  fetchJobHistoryIssues: vi.fn().mockResolvedValue([]),
}));

const definition: JobDefinition = {
  kind: 'library.scan',
  label: 'Scan for changes',
  description: 'Looks for new and changed files.',
  needsLibrary: true,
  destructive: false,
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
    artefacts: null,
  },
  queue: { concurrency: 2, queued: 0, running: jobs.length, jobs, ...queue },
  sessions: 0,
  logs: [],
  cache: null,
});

const props = {
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
  onViewLogs: vi.fn(),
};

/**
 * Renders under the query client `JobHistory` needs, since it is always mounted alongside the rest
 * of the panel.
 */
const renderPanel = (element: ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      {element}
    </QueryClientProvider>,
  );

describe('JobsPanel', () => {
  it('opens on the history tab, the merged live-and-persisted view', () => {
    renderPanel(<JobsPanel {...props} />);

    expect(screen.getByText('Reading job history…')).toBeInTheDocument();
  });

  it('says nothing about the queue before a reading has arrived', () => {
    renderPanel(<JobsPanel {...props} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('summarises the queue rather than making somebody count', () => {
    renderPanel(<JobsPanel {...props} monitor={reading([job()], { queued: 3, running: 1 })} />);

    expect(screen.getByText(/1 running · 3 waiting · 2 at a time/)).toBeInTheDocument();
  });

  it('mentions failures only when there are some', () => {
    renderPanel(<JobsPanel {...props} monitor={reading([job()])} />);

    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
  });

  it('counts failures into the summary when there are', () => {
    renderPanel(<JobsPanel {...props} monitor={reading([job({ state: 'failed' })])} />);

    expect(screen.getByText(/1 failed/)).toBeInTheDocument();
  });

  it('switches to the run-and-schedule tab, and back', async () => {
    const user = userEvent.setup();
    renderPanel(<JobsPanel {...props} />);

    await user.click(screen.getByRole('tab', { name: 'Run & schedule' }));
    expect(screen.getByText('Scan for changes')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'History' }));
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
  });

  describe('opening a schedule', () => {
    it('opens over the list rather than taking its place', () => {
      renderPanel(<JobsPanel {...props} viewingJobKind="library.scan" />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Reading job history…')).toBeInTheDocument();
    });

    it('stays shut for a job kind it does not know', () => {
      renderPanel(<JobsPanel {...props} viewingJobKind="library.summon" />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Reading job history…')).toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobsPanel.displayName).toBe('JobsPanel');
  });
});
