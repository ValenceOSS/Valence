import { render } from '@testing-library/react';
import { Thumbnail } from '@remotion/player';
import { describe, expect, it } from 'vitest';
import { SceneCursor } from './SceneCursor';

/**
 * A scene holding nothing but a pointer that glides from one corner to the middle and presses there.
 */
const Gliding = () => (
  <SceneCursor
    path={[
      { at: 0, x: 10, y: 10 },
      { at: 20, x: 50, y: 50 },
      { at: 30, x: 50, y: 50, isPressing: true },
    ]}
  />
);

Gliding.displayName = 'Gliding';

const pointerAt = (frame: number) => {
  const { container } = render(
    <Thumbnail
      component={Gliding}
      durationInFrames={60}
      fps={30}
      compositionWidth={200}
      compositionHeight={100}
      frameToDisplay={frame}
    />,
  );

  return container.querySelector<HTMLElement>('.z-20');
};

describe('SceneCursor', () => {
  it('rests where its path starts and arrives where it goes', () => {
    expect(pointerAt(0)?.style.left).toBe('10%');
    expect(pointerAt(25)?.style.left).toBe('50%');
  });

  it('eases between its stops rather than jumping', () => {
    const halfway = Number.parseFloat(pointerAt(10)?.style.left ?? '0');

    expect(halfway).toBeGreaterThan(10);
    expect(halfway).toBeLessThan(50);
  });

  it('presses down where its path says so, and lets go after', () => {
    expect(pointerAt(31)?.style.transform).toContain('0.88');
    expect(pointerAt(45)?.style.transform).not.toContain('0.88');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SceneCursor.displayName).toBe('SceneCursor');
  });
});
