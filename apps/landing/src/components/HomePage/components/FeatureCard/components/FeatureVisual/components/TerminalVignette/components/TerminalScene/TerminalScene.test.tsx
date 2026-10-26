import { render } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { TerminalScene } from './TerminalScene';

/**
 * Draws the scene at one frame of it.
 *
 * @param frame - The frame to draw.
 * @returns What was drawn.
 */
const atFrame = (frame: number) =>
  render(
    <Thumbnail
      component={TerminalScene}
      durationInFrames={220}
      fps={30}
      compositionWidth={640}
      compositionHeight={288}
      frameToDisplay={frame}
    />,
  );

describe('TerminalScene', () => {
  it('rests before the server finishes coming up', () => {
    const { container } = atFrame(0);

    expect(container.querySelector('[data-acted]')).toBeNull();
  });

  it('is acted out while the server finishes, and only until it lets go', () => {
    expect(atFrame(58).container.querySelector('[data-acted]')).not.toBeNull();
    expect(atFrame(170).container.querySelector('[data-acted]')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TerminalScene.displayName).toBe('TerminalScene');
  });
});
