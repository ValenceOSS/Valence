import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchJobStats } from '@ValenceClient/admin/fetchJobStats';
import { JobHealth } from './JobHealth';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';

vi.mock('@ValenceClient/admin/fetchJobStats', () => ({ fetchJobStats: vi.fn() }));

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

const stats = (over: object) => ({
  kind: 'library.scan',
  runs: 100,
  completed: 99,
  failed: 1,
  running: 0,
  medianMs: 1400,
  slowestMs: 125_000,
  lastAtMs: 1_700_000_000_000,
  ...over,
});

const draw = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <JobHealth definitions={DEFINITIONS} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.mocked(fetchJobStats).mockResolvedValue({
    sinceMs: 0,
    kinds: [
      stats({}),
      stats({
        kind: 'catalogue.rematch',
        runs: 10,
        completed: 8,
        failed: 2,
        medianMs: null,
        slowestMs: 9000,
      }),
    ],
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('JobHealth', () => {
  it('says how reliable each kind of job has been, in words for the ones it knows', async () => {
    draw();

    await screen.findByText('Scan for changes');

    const table = screen.getByRole('table', { name: 'How each kind of job has gone' });

    expect(within(table).getByText('Scan for changes')).toBeInTheDocument();
    expect(within(table).getAllByText('catalogue.rematch')).toHaveLength(2);
    expect(within(table).getByText('99%')).toBeInTheDocument();
    expect(within(table).getByText('80%')).toBeInTheDocument();
  });

  it('says how long the typical run took, and the slowest', async () => {
    draw();

    await screen.findByText('Scan for changes');

    const table = screen.getByRole('table', { name: 'How each kind of job has gone' });

    expect(within(table).getByText('1.4 s')).toBeInTheDocument();
    expect(within(table).getByText('2 min 5 s')).toBeInTheDocument();
    expect(within(table).getByText('9 s')).toBeInTheDocument();
  });

  it('adds it all up for the strip above', async () => {
    draw();

    await screen.findByText('Scan for changes');

    const strip = screen.getByLabelText('How the jobs are doing overall');

    expect(within(strip).getByText('110')).toBeInTheDocument();
    expect(within(strip).getByText('3')).toBeInTheDocument();
    expect(within(strip).getByText('97.2%')).toBeInTheDocument();
  });

  it('asks about the last week to begin with, and about the period chosen after', async () => {
    draw();
    await screen.findByText('Scan for changes');

    const first = vi.mocked(fetchJobStats).mock.calls[0]?.[0] ?? 0;

    expect(Date.now() - first).toBeGreaterThan(6.9 * 86_400_000);

    await userEvent.click(screen.getByRole('button', { name: 'Period' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Last 24 hours' }));

    await vi.waitFor(() => {
      const last = vi.mocked(fetchJobStats).mock.calls.at(-1)?.[0] ?? 0;

      expect(Date.now() - last).toBeLessThan(1.1 * 86_400_000);
    });
  });

  it('says so where no job has run', async () => {
    vi.mocked(fetchJobStats).mockResolvedValue({ sinceMs: 0, kinds: [] });

    draw();

    expect(await screen.findByText('No job has run in this time.')).toBeInTheDocument();
  });

  it('draws no cards, being laid flat on the page', async () => {
    const { container } = draw();

    await screen.findByText('Scan for changes');

    expect(container.querySelector('.valence-card-shell, .valence-card-face')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobHealth.displayName).toBe('JobHealth');
  });
});
