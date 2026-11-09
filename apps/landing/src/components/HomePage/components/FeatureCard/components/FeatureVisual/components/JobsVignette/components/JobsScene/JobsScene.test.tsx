import { render } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { JobsScene } from './JobsScene';

/**
 * Draws the scene at one frame of it.
 *
 * @param frame - The frame to draw.
 * @returns What was drawn.
 */
const atFrame = (frame: number) =>
  render(
    <Thumbnail
      component={JobsScene}
      durationInFrames={260}
      fps={30}
      compositionWidth={640}
      compositionHeight={288}
      frameToDisplay={frame}
    />,
  );

/**
 * What the scan's progress bar says at a frame, or null where it is not running.
 *
 * @param frame - The frame to draw.
 * @returns The bar's label, or null.
 */
const progressAt = (frame: number) =>
  atFrame(frame).container.querySelector('[role=progressbar]')?.getAttribute('aria-label') ?? null;

describe('JobsScene', () => {
  it('rests until the pointer runs the scan', () => {
    expect(atFrame(0).container.querySelector('[data-acted]')).toBeNull();
  });

  it('reads the files first, then draws the scrub previews they are missing', () => {
    expect(progressAt(100)).toBe('Scan for changes: Probing');
    expect(progressAt(180)).toBe('Scan for changes: Generating scrub previews');
  });

  it('finishes and rests again before it goes round, so it has no seam', () => {
    expect(atFrame(240).container.querySelector('[data-acted]')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobsScene.displayName).toBe('JobsScene');
  });
});
