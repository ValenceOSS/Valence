import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreamTrends } from './StreamTrends';

const HISTORY = [
  { connectionKbps: 95_000, bitrateKbps: 14_534, bufferedAheadSeconds: 40 },
  { connectionKbps: 92_000, bitrateKbps: 14_534, bufferedAheadSeconds: 63.3 },
];

describe('StreamTrends', () => {
  it('draws the network and the buffer over time', () => {
    render(<StreamTrends history={HISTORY} />);

    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Buffer')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Connection speed and stream bitrate over the last minute',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Seconds buffered ahead over the last minute' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StreamTrends.displayName).toBe('StreamTrends');
  });
});
