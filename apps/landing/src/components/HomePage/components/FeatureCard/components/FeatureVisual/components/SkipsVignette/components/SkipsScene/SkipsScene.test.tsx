import { render, screen } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { SkipsScene } from './SkipsScene';

const atFrame = (frame: number) =>
  render(
    <Thumbnail
      component={SkipsScene}
      durationInFrames={240}
      fps={30}
      compositionWidth={323}
      compositionHeight={182}
      frameToDisplay={frame}
    />,
  );

describe('SkipsScene', () => {
  it('plays into the intro, with the skip on offer', () => {
    atFrame(40);

    expect(screen.getByText(/^3:1\d$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip Intro/ })).toBeInTheDocument();
  });

  it('lands past the intro once the skip is pressed', () => {
    atFrame(120);

    expect(screen.getByText(/^4:4\d$/)).toBeInTheDocument();
  });

  it('is back before the intro by the end, where it began', () => {
    atFrame(239);

    expect(screen.getByText(/^3:1\d$/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SkipsScene.displayName).toBe('SkipsScene');
  });
});
