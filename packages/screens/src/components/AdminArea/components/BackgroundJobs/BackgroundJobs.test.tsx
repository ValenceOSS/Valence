import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackgroundJobs } from './BackgroundJobs';
import type { Job, Monitor } from '@ValenceClient/admin/fetchAdmin';

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  kind: 'fingerprint',
  subject: 'Ted S01E01.mkv',
  state: 'running',
  queuedAtMs: 0,
  startedAtMs: 0,
  finishedAtMs: null,
  correlationId: null,
  failure: null,
  ...overrides,
});

const monitor = (jobs: Job[]): Monitor => ({
  resources: {
    atMs: 0,
    systemCpuPercent: 0,
    systemMemoryUsedBytes: 1,
    systemMemoryTotalBytes: 10,
    cpuCount: 4,
    serviceCpuPercent: 0,
    serviceMemoryBytes: 1,
    children: [],
    deploymentMemory: null,
    apiMemoryBytes: null,
    loadAverage: 0,
    disks: [],
    graphics: null,
    artefacts: null,
  },
  queue: { concurrency: 1, queued: 0, running: jobs.length, jobs },
  sessions: 0,
  logs: [],
  cache: null,
});

describe('BackgroundJobs', () => {
  it('says what work is being done rather than printing the queue’s own word', () => {
    render(<BackgroundJobs monitor={monitor([job()])} />);

    expect(screen.getByText('Comparing episode audio')).toBeInTheDocument();
    expect(screen.queryByText('fingerprint')).not.toBeInTheDocument();
  });

  it('calls the seek-bar strip scrub previews', () => {
    render(<BackgroundJobs monitor={monitor([job({ kind: 'thumbnails' })])} />);

    expect(screen.getByText('Drawing scrub previews')).toBeInTheDocument();
    expect(screen.queryByText('thumbnails')).not.toBeInTheDocument();
  });

  it('names the file being worked on, which is how somebody finds it', () => {
    render(<BackgroundJobs monitor={monitor([job()])} />);

    expect(screen.getByText('Ted S01E01.mkv')).toBeInTheDocument();
  });

  it('shows an unfamiliar kind rather than an empty cell', () => {
    render(<BackgroundJobs monitor={monitor([job({ kind: 'something-new' })])} />);

    expect(screen.getByText('something-new')).toBeInTheDocument();
  });

  it('says the queue is empty rather than drawing a bare table', () => {
    render(<BackgroundJobs monitor={monitor([])} />);

    expect(screen.queryByText('Ted S01E01.mkv')).not.toBeInTheDocument();
    expect(screen.getByText('Nothing queued.')).toBeInTheDocument();
  });

  it('says it is still reading before the first reading arrives, not confirmed empty', () => {
    render(<BackgroundJobs monitor={null} />);

    expect(screen.getByText('Reading the queue…')).toBeInTheDocument();
    expect(screen.queryByText('Nothing queued.')).not.toBeInTheDocument();
  });

  it('tells an operator when the reading could not be had at all', () => {
    render(<BackgroundJobs monitor={null} isUnreachable />);

    expect(screen.queryByText('Comparing episode audio')).not.toBeInTheDocument();
    expect(screen.getByText('The queue could not be read from the server.')).toBeInTheDocument();
    expect(screen.queryByText('Reading the queue…')).not.toBeInTheDocument();
  });

  it('paints each state in the colour that state means, not one borrowed from another', () => {
    render(
      <BackgroundJobs
        monitor={monitor([
          job({ id: 1, state: 'queued', startedAtMs: null, finishedAtMs: null }),
          job({ id: 2, state: 'running', startedAtMs: 0, finishedAtMs: null }),
          job({ id: 3, state: 'finished', startedAtMs: 0, finishedAtMs: 1_000 }),
          job({ id: 4, state: 'failed', startedAtMs: 0, finishedAtMs: 2_000 }),
        ])}
      />,
    );

    expect(screen.getByText('Queued')).toHaveClass('bg-busy');
    expect(screen.getAllByText('Running')[0]).toHaveClass('bg-busy');
    expect(screen.getByText('Done')).toHaveClass('bg-success');
    expect(screen.getByText('Failed')).toHaveClass('bg-danger');
  });
});
