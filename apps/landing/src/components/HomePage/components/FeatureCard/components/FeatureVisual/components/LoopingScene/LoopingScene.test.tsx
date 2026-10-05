import { render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { useCurrentFrame } from 'remotion';
import { describe, expect, it } from 'vitest';
import { LoopingScene } from './LoopingScene';

/**
 * A scene that says which frame it is drawn at.
 */
const SaysItsFrame = () => <span>frame {useCurrentFrame().toString()}</span>;

SaysItsFrame.displayName = 'SaysItsFrame';

describe('LoopingScene', () => {
  it('draws its scene from the frame it is told to start from', () => {
    render(
      <LoopingScene
        scene={SaysItsFrame}
        frames={240}
        width={200}
        height={100}
        still={120}
        startsAt={30}
      />,
    );

    expect(screen.getByText('frame 30')).toBeInTheDocument();
  });

  it('holds one telling frame still for somebody who asked for less motion', () => {
    render(
      <MotionConfig reducedMotion="always">
        <LoopingScene scene={SaysItsFrame} frames={240} width={200} height={100} still={120} />
      </MotionConfig>,
    );

    expect(screen.getByText('frame 120')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LoopingScene.displayName).toBe('LoopingScene');
  });
});
