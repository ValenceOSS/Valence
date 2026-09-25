import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MoodBackground } from './MoodBackground';
import type * as MotionReact from 'motion/react';

const motion = vi.hoisted(() => ({ isReduced: false }));

vi.mock('motion/react', async () => ({
  ...(await vi.importActual<typeof MotionReact>('motion/react')),
  useReducedMotion: () => motion.isReduced,
  useReducedMotionConfig: () => motion.isReduced,
}));

/**
 * The lights themselves, one for each place a light can sit.
 */
const blooms = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll('.valence-bloom')).filter(
    (found): found is HTMLElement => found instanceof HTMLElement,
  );

afterEach(() => {
  motion.isReduced = false;
});

describe('MoodBackground', () => {
  it('puts a light where the picture said it came from', () => {
    const { container } = render(
      <MoodBackground lights={[{ color: 'rgb(10, 20, 30)', at: '77% 12%' }]} />,
    );

    expect(blooms(container)[0]?.style.background).toContain('77% 12%');
  });

  it('lights the page from each colour it is given', () => {
    const { container } = render(
      <MoodBackground lights={[{ color: 'rgb(120, 40, 200)' }, { color: 'rgb(20, 160, 120)' }]} />,
    );

    expect(blooms(container)[0]?.style.background).toContain('rgb(120, 40, 200)');
    expect(blooms(container)[1]?.style.background).toContain('rgb(20, 160, 120)');
  });

  it('falls back to the house colour when nothing on screen has any light to give', () => {
    const { container } = render(<MoodBackground />);

    expect(blooms(container).length).toBeGreaterThan(0);
    expect(blooms(container)[0]?.style.background).toContain('rgb(56, 68, 150)');
  });

  it('ignores a colour that is not one', () => {
    const { container } = render(
      <MoodBackground lights={[{ color: '' }, { color: 'rgb(20, 160, 120)' }]} />,
    );

    expect(blooms(container)[0]?.style.background).toContain('rgb(20, 160, 120)');
  });

  it('keeps a bloom for every place, dark past the lights it was given', () => {
    const { container } = render(<MoodBackground lights={[{ color: 'rgb(20, 160, 120)' }]} />);

    expect(blooms(container)).toHaveLength(12);
    expect(blooms(container)[5]?.style.background).toContain('0%, transparent');
  });

  it('draws no more lights than it has places to put them', () => {
    const { container } = render(
      <MoodBackground
        lights={[
          { color: '#111111' },
          { color: '#222222' },
          { color: '#333333' },
          { color: '#444444' },
          { color: '#555555' },
          { color: '#666666' },
          { color: '#777777' },
          { color: '#888888' },
          { color: '#999999' },
          { color: '#aaaaaa' },
          { color: '#bbbbbb' },
          { color: '#cccccc' },
          { color: '#dddddd' },
          { color: '#eeeeee' },
        ]}
      />,
    );

    expect(blooms(container)).toHaveLength(12);
  });

  it('has a place for a light from each cell of the grid a picture is read in', () => {
    const lights = Array.from({ length: 12 }, (_, at) => ({
      color: `rgb(${at.toString()} 0 0)`,
    }));

    const { container } = render(<MoodBackground lights={lights} />);

    expect(blooms(container)).toHaveLength(12);
  });

  it('keeps the page under the light, so the foot of the screen is the page', () => {
    const { container } = render(<MoodBackground lights={[{ color: '#112233' }]} />);

    expect(container.querySelector('.valence-mood-fade')).not.toBeNull();
  });

  it('lets the light wander where a screen is being waited on', () => {
    const { container } = render(<MoodBackground lights={[{ color: '#112233' }]} isDrifting />);

    expect(blooms(container)[0]?.className).toContain('valence-bloom--drift');
  });

  it('holds it still everywhere else', () => {
    const { container } = render(<MoodBackground lights={[{ color: '#112233' }]} />);

    expect(blooms(container)[0]?.className).not.toContain('valence-bloom--drift');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MoodBackground.displayName).toBe('MoodBackground');
  });

  it('stops the lights drifting for somebody who asked for less motion', () => {
    motion.isReduced = true;

    const { container } = render(<MoodBackground lights={[{ color: '#112233' }]} isDrifting />);

    expect(blooms(container)[0]?.className).not.toContain('valence-bloom--drift');
  });
});
