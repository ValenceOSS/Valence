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
      compositionWidth={560}
      compositionHeight={450}
      frameToDisplay={frame}
    />,
  );

describe('DevicesScene', () => {
  it('starts with the phone being converted for', () => {
    atFrame(0);

    expect(screen.getByText('Transcoding')).toBeInTheDocument();
    expect(screen.getByText('Maya’s phone')).toBeInTheDocument();
  });

  it('finds the phone can play the file as it is', () => {
    atFrame(160);

    expect(screen.queryByText('Transcoding')).toBeNull();
    expect(screen.getAllByText('DirectPlay')).toHaveLength(3);
  });

  it('is converting again by the end, where it began', () => {
    atFrame(239);

    expect(screen.getByText('Transcoding')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DevicesScene.displayName).toBe('DevicesScene');
  });
});
