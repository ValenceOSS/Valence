import { render, screen } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { HdrScene } from './HdrScene';

const lineAt = (frame: number): string => {
  const { container } = render(
    <Thumbnail
      component={HdrScene}
      durationInFrames={240}
      fps={30}
      compositionWidth={323}
      compositionHeight={182}
      frameToDisplay={frame}
    />,
  );

  return container.querySelector<HTMLElement>('.w-px')?.style.left ?? '';
};

describe('HdrScene', () => {
  it('names the range on either side of the line', () => {
    render(
      <Thumbnail
        component={HdrScene}
        durationInFrames={240}
        fps={30}
        compositionWidth={323}
        compositionHeight={182}
        frameToDisplay={0}
      />,
    );

    expect(screen.getByText('SDR')).toBeInTheDocument();
    expect(screen.getByText('HDR10')).toBeInTheDocument();
  });

  it('drags the line across and brings it home to the middle', () => {
    expect(lineAt(0)).toBe('50%');
    expect(Number.parseFloat(lineAt(96))).toBeLessThan(20);
    expect(lineAt(239)).toBe('50%');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HdrScene.displayName).toBe('HdrScene');
  });
});
