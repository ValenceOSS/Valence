import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaybackModeShare } from './PlaybackModeShare';

const MODES = { DirectPlay: 6, Remux: 1, DirectStream: 0, Transcode: 3 };

describe('PlaybackModeShare', () => {
  it('names why plays were converted', () => {
    render(
      <PlaybackModeShare modes={MODES} reasons={[{ code: 'AudioCodecNotSupported', plays: 3 }]} />,
    );

    expect(screen.getByText('The device can’t play the sound format')).toBeInTheDocument();
  });

  it('says every play went as the file lies when none was converted', () => {
    render(<PlaybackModeShare modes={{ ...MODES, Transcode: 0, Remux: 0 }} reasons={[]} />);

    expect(screen.getByText('Every play went as the file lies.')).toBeInTheDocument();
  });
});
