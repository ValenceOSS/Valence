import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { connection } from 'next/server';
import { someStats } from '@ValenceMetrics/testing/someStats';
import { StatsPage } from './StatsPage';

vi.mock('next/server', () => ({ connection: vi.fn(() => Promise.resolve(undefined)) }));

vi.mock('@ValenceMetrics/stats/readCachedStats', () => ({
  readCachedStats: vi.fn(() => Promise.resolve(someStats())),
}));

vi.mock('@ValenceMetrics/downloads/readDownloads', () => ({
  readDownloads: vi.fn(() => Promise.resolve({ isKnown: true, total: 4321, releases: [] })),
}));

describe('StatsPage', () => {
  it('reads the figures as the page is asked for and lays them out', async () => {
    render(await StatsPage());

    expect(connection).toHaveBeenCalled();
    expect(screen.getByText('4,321')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatsPage.displayName).toBe('StatsPage');
  });
});
