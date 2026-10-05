import { render, screen } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { DevicesScene } from './DevicesScene';

const atFrame = (frame: number) =>
  render(
    <Thumbnail
      component={DevicesScene}
      durationInFrames={240}
      fps={30}
      compositionWidth={423}
      compositionHeight={262}
      frameToDisplay={frame}
    />,
  );

describe('DevicesScene', () => {
  it('starts with the phone being converted for', () => {
    atFrame(0);

    expect(screen.getByText('Converting')).toBeInTheDocument();
    expect(screen.getByText('Converting to H.264 1080p on NVENC')).toBeInTheDocument();
  });

  it('finds the phone can play the file as it is', () => {
    atFrame(160);

    expect(screen.queryByText('Converting')).toBeNull();
    expect(screen.getByText('HEVC 1080p, played as it is')).toBeInTheDocument();
  });

  it('is converting again by the end, where it began', () => {
    atFrame(239);

    expect(screen.getByText('Converting')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DevicesScene.displayName).toBe('DevicesScene');
  });
});
