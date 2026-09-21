import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchJobStats } from '@ValenceClient/admin/fetchJobStats';
import { ObservabilitySearchHost } from '@ValenceScreens/testing/ObservabilitySearchHost';
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
      <ObservabilitySearchHost>
        {(search, update) => (
          <JobHealth definitions={DEFINITIONS} search={search} onSearchChange={update} />
        )}
      </ObservabilitySearchHost>
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
    expect(within(table).getByText('Rematch')).toBeInTheDocument();
    expect(within(table).getByText('99%')).toBeInTheDocument();
    expect(within(table).getByText('80%')).toBeInTheDocument();
  });

  it('says how long the typical run took, and the slowest', async () => {
    draw();

    await screen.findByText('Scan for changes');

    const table = screen.getByRole('table', { name: 'How each kind of job has gone' });

    expect(table).toHaveTextContent('1.4 s');
    expect(table).toHaveTextContent('2 min 5 s');
    expect(table).toHaveTextContent('9 s');
  });

  it('adds it all up for the strip above', async () => {
    draw();

    await screen.findByText('Scan for changes');

    const strip = screen.getByLabelText('How the jobs are doing overall');

    expect(within(strip).getByText('110')).toBeInTheDocument();
    expect(within(strip).getByText('3')).toBeInTheDocument();
    expect(within(strip).getByText('97.2%')).toBeInTheDocument();
  });

  it('asks about the last day to begin with, and about the range chosen after', async () => {
    draw();
    await screen.findByText('Scan for changes');

    const first = vi.mocked(fetchJobStats).mock.calls[0]?.[0] ?? 0;

    expect(Date.now() - first).toBeLessThan(1.1 * 86_400_000);

    await userEvent.click(screen.getByRole('button', { name: 'Time range' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Last 7 days' }));

    await vi.waitFor(() => {
      const last = vi.mocked(fetchJobStats).mock.calls.at(-1)?.[0] ?? 0;

      expect(Date.now() - last).toBeGreaterThan(6.9 * 86_400_000);
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
