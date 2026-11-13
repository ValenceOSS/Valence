import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NetworkInfo } from './NetworkInfo';

describe('NetworkInfo', () => {
  it('says what is coming in, going out, streaming to viewers and everything else', () => {
    render(
      <NetworkInfo
        network={{ receivedBytesPerSecond: 2_048, sentBytesPerSecond: 3_145_728 }}
        streamedBytesPerSecond={2_097_152}
      />,
    );

    expect(screen.getByText('Coming in')).toBeInTheDocument();
    expect(screen.getByText('Going out')).toBeInTheDocument();
    expect(screen.getByText('Streaming to viewers')).toBeInTheDocument();
    expect(screen.getByText('Everything else going out')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('writes a dash, never zero, where the counters could not be read', () => {
    render(<NetworkInfo network={null} streamedBytesPerSecond={1_024} />);

    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(
      screen.getByText("This machine's network counters could not be read."),
    ).toBeInTheDocument();
  });
});
