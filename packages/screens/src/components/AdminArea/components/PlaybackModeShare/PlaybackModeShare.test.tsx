import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaybackModeShare } from './PlaybackModeShare';

describe('PlaybackModeShare', () => {
  it('shows how many plays went each way', () => {
    render(
      <PlaybackModeShare modes={{ DirectPlay: 6, Remux: 1, DirectStream: 0, Transcode: 3 }} />,
    );

    expect(screen.getByText('Remux')).toBeInTheDocument();
  });

  it('says when nothing was played', () => {
    render(
      <PlaybackModeShare modes={{ DirectPlay: 0, Remux: 0, DirectStream: 0, Transcode: 0 }} />,
    );

    expect(screen.getByText('Nothing was played in this range.')).toBeInTheDocument();
  });
});
