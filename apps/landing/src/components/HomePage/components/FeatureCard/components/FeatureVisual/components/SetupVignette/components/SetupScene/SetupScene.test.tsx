import { render } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { SetupScene } from './SetupScene';

/**
 * Draws the scene at one frame of it.
 *
 * @param frame - The frame to draw.
 * @returns What was drawn.
 */
const atFrame = (frame: number) =>
  render(
    <Thumbnail
      component={SetupScene}
      durationInFrames={222}
      fps={30}
      compositionWidth={323}
      compositionHeight={240}
      frameToDisplay={frame}
    />,
  );

describe('SetupScene', () => {
  it('rests until the pointer acts it out', () => {
    const { container } = atFrame(0);

    expect(container.querySelector('[data-acted]')).toBeNull();
  });

  it('is acted out once the pointer has done its part, and only until it lets go', () => {
    expect(atFrame(60).container.querySelector('[data-acted]')).not.toBeNull();
    expect(atFrame(172).container.querySelector('[data-acted]')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SetupScene.displayName).toBe('SetupScene');
  });
});
