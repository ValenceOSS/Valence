import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Statistics } from '@ValenceContracts/schemas/Statistics';
import { StatisticsPanel } from './StatisticsPanel';

const quiet = () => Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

const STATISTICS: Statistics = {
  range: 'week',
  from: '2026-10-10T12:00:00.000Z',
  to: '2026-10-17T12:00:00.000Z',
  totals: { plays: 12, hours: 9.5, viewers: 3, titles: 4 },
  days: [{ day: '2026-10-17', plays: 12, hours: 9.5 }],
  busyHours: quiet(),
  busyDetail: [],
  topTitles: [{ mediaItemId: 'e1', seriesId: 's', title: 'Severance', plays: 8, hours: 6 }],
  topViewers: [{ profileId: 'p', name: 'Priya', plays: 7, hours: 5 }],
  modes: { DirectPlay: 9, Remux: 0, DirectStream: 1, Transcode: 2 },
  reasons: [{ code: 'VideoCodecNotSupported', plays: 2 }],
  clients: [
    {
      client: 'Living room TV',
      plays: 12,
      modes: { DirectPlay: 9, Remux: 0, DirectStream: 1, Transcode: 2 },
    },
  ],
  added: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StatisticsPanel', () => {
  it('shows what was watched and how it played', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(STATISTICS)))),
    );

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <StatisticsPanel onOpenPanel={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Severance')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('Living room TV')).toBeInTheDocument();
  });
});
