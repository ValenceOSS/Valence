import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { someStats } from '@ValenceMetrics/testing/someStats';
import { StatsDashboard } from './StatsDashboard';

const DOWNLOADS = {
  isKnown: true,
  total: 12345,
  releases: [
    { tag: 'v1.7.0', downloads: 65, publishedAt: '2026-10-01T00:00:00Z' },
    { tag: 'v1.6.0', downloads: 40, publishedAt: '2026-09-01T00:00:00Z' },
  ],
};

describe('StatsDashboard', () => {
  it('says what the figures are and where to read what is sent', () => {
    render(<StatsDashboard stats={someStats()} downloads={DOWNLOADS} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'How Valence is run' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Exactly what is sent' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/use/telemetry',
    );
  });

  it('leads with the active servers and the downloads', () => {
    render(<StatsDashboard stats={someStats()} downloads={DOWNLOADS} />);

    expect(screen.getByRole('heading', { name: 'Active servers' })).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Downloads by release' })).toHaveTextContent('v1.6.0');
  });

  it('lists what the servers run on, question by question', () => {
    render(<StatsDashboard stats={someStats()} downloads={DOWNLOADS} />);

    for (const question of ['Version', 'Operating system', 'Graphics cards', 'Books']) {
      expect(screen.getByRole('list', { name: question })).toBeInTheDocument();
    }

    expect(screen.getByText('62.5%')).toBeInTheDocument();
  });

  it('shows only the count until there are enough servers to hide each one in', () => {
    render(<StatsDashboard stats={someStats({ isEnoughToShow: false })} downloads={DOWNLOADS} />);

    expect(screen.getByText('Not enough reports yet')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Version' })).not.toBeInTheDocument();
  });

  it('says the downloads are not known where GitHub could not be asked', () => {
    render(
      <StatsDashboard stats={someStats()} downloads={{ isKnown: false, total: 0, releases: [] }} />,
    );

    expect(screen.getAllByText('–')).toHaveLength(2);
    expect(screen.getByText('GitHub could not be asked just now.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatsDashboard.displayName).toBe('StatsDashboard');
  });
});
