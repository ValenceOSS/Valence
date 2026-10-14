import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShareChart } from './ShareChart';

const slices = [
  { id: 'films', label: 'Films', value: 75, shown: '75 GB' },
  { id: 'shows', label: 'Shows', value: 25, shown: '25 GB' },
  { id: 'music', label: 'Music', value: 0, shown: '0 GB' },
];

describe('ShareChart', () => {
  it('reads out what the ring shows', () => {
    render(
      <ShareChart
        label="How the libraries share the disk"
        slices={slices}
        total="100 GB"
        totalLabel="in libraries"
        emptyMessage="No libraries yet"
      />,
    );

    expect(screen.getByRole('img', { name: 'How the libraries share the disk' })).toBeVisible();
  });

  it('writes the whole in the middle of the ring', () => {
    render(
      <ShareChart
        label="Disk"
        slices={slices}
        total="100 GB"
        totalLabel="in libraries"
        emptyMessage="No libraries yet"
      />,
    );

    expect(screen.getByText('100 GB')).toBeInTheDocument();
    expect(screen.getByText('in libraries')).toBeInTheDocument();
  });

  it('names each part with what it comes to and its share, empty ones included', () => {
    render(
      <ShareChart
        label="Disk"
        slices={slices}
        total="100 GB"
        totalLabel="in libraries"
        emptyMessage="No libraries yet"
      />,
    );

    expect(screen.getByText('Films')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('says so where every part is empty', () => {
    render(
      <ShareChart
        label="Disk"
        slices={[{ id: 'films', label: 'Films', value: 0, shown: '0 GB' }]}
        total="0 GB"
        totalLabel="in libraries"
        emptyMessage="No libraries yet"
      />,
    );

    expect(screen.getByText('No libraries yet')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShareChart.displayName).toBe('ShareChart');
  });
});
