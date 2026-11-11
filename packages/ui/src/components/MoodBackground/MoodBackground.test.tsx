import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ShaderMountProps } from '@paper-design/shaders-react';
import { MoodBackground } from './MoodBackground';
import type * as MotionReact from 'motion/react';

const motion = vi.hoisted(() => ({ isReduced: false }));

const tints = vi.hoisted(() => new Map<string, number>());

vi.mock('motion/react', async () => ({
  ...(await vi.importActual<typeof MotionReact>('motion/react')),
  useReducedMotion: () => motion.isReduced,
  useReducedMotionConfig: () => motion.isReduced,
}));

vi.mock('./tintOf', () => ({
  tintOf: (colour: string): [number, number, number] => {
    if (!tints.has(colour)) {
      tints.set(colour, tints.size + 1);
    }

    return [(tints.get(colour) ?? 0) / 255, 0, 0];
  },
}));

const rowsOf = (value: ShaderMountProps['uniforms'][string]): number[][] =>
  Array.isArray(value)
    ? value.map((row) =>
        Array.isArray(row) ? row.map((each) => (typeof each === 'number' ? each : Number.NaN)) : [],
      )
    : [];

vi.mock('@paper-design/shaders-react', () => ({
  ShaderMount: (props: ShaderMountProps) => {
    return (
      <div data-testid="shader-mount" data-speed={String(props.speed)}>
        {rowsOf(props.uniforms['u_orbs']).map((orb, at) => (
          <span
            key={`orb-${at.toString()}`}
            data-orb=""
            data-x={String(orb[0])}
            data-y={String(orb[1])}
            data-strength={String(orb[2])}
            data-tint={String(Math.floor((orb[3] ?? 0) / 65536))}
          />
        ))}
      </div>
    );
  },
}));

const orbs = () =>
  Array.from(screen.getByTestId('shader-mount').querySelectorAll('[data-orb]')).map((orb) => [
    Number(orb.getAttribute('data-x')),
    Number(orb.getAttribute('data-y')),
    Number(orb.getAttribute('data-strength')),
  ]);

const tintCodes = () =>
  Array.from(screen.getByTestId('shader-mount').querySelectorAll('[data-orb]')).map((orb) =>
    Number(orb.getAttribute('data-tint')),
  );

const speed = () => Number(screen.getByTestId('shader-mount').getAttribute('data-speed'));

afterEach(() => {
  motion.isReduced = false;
});

describe('MoodBackground', () => {
  it('puts a light where the picture said it came from', () => {
    render(<MoodBackground lights={[{ color: 'rgb(10, 20, 30)', at: '77% 12%' }]} />);

    expect(orbs()[0]?.[0]).toBeCloseTo(0.77);
    expect(orbs()[0]?.[1]).toBeCloseTo(0.12);
  });

  it('lights the page from each colour it is given', () => {
    render(
      <MoodBackground lights={[{ color: 'rgb(120, 40, 200)' }, { color: 'rgb(20, 160, 120)' }]} />,
    );

    expect(tintCodes()[0]).toBe(tints.get('rgb(120, 40, 200)'));
    expect(tintCodes()[1]).toBe(tints.get('rgb(20, 160, 120)'));
  });

  it('falls back to the house colours when nothing on screen has any light to give', () => {
    render(<MoodBackground />);

    expect(orbs()).toHaveLength(24);
    expect(tints.has('rgb(56 68 150)')).toBe(true);
  });

  it('ignores a colour that is not one', () => {
    render(<MoodBackground lights={[{ color: '' }, { color: 'rgb(20, 160, 121)' }]} />);

    expect(tintCodes()[0]).toBe(tints.get('rgb(20, 160, 121)'));
  });

  it('repeats a few lights across every place, so the whole page glows', () => {
    render(<MoodBackground lights={[{ color: 'rgb(20, 160, 120)' }]} />);

    expect(orbs()).toHaveLength(24);
    expect(orbs()[0]?.[2]).toBeGreaterThan(0);
    expect(orbs()[5]?.[2]).toBeGreaterThan(0);
    expect(tintCodes()[5]).toBe(tintCodes()[0]);
  });

  it('draws no more lights than it has places to put them', () => {
    render(
      <MoodBackground
        lights={Array.from({ length: 26 }, (_, at) => ({ color: `rgb(${at.toString()} 1 1)` }))}
      />,
    );

    expect(orbs()).toHaveLength(24);
  });

  it('keeps the page under the light, so the foot of the screen is the page', () => {
    const { container } = render(<MoodBackground lights={[{ color: '#112233' }]} />);

    expect(container.querySelector('.valence-mood-fade')).not.toBeNull();
  });

  it('lets the light wander where a screen is being waited on, faster when lively', () => {
    const { unmount } = render(<MoodBackground lights={[{ color: '#112233' }]} isDrifting />);

    expect(speed()).toBe(1);

    unmount();
    render(<MoodBackground lights={[{ color: '#112233' }]} isDrifting isLively />);

    expect(speed()).toBeGreaterThan(1);
  });

  it('holds it still everywhere else', () => {
    render(<MoodBackground lights={[{ color: '#112233' }]} />);

    expect(speed()).toBe(0);
  });

  it('stops the lights drifting for somebody who asked for less motion', () => {
    motion.isReduced = true;

    render(<MoodBackground lights={[{ color: '#112233' }]} isDrifting />);

    expect(speed()).toBe(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MoodBackground.displayName).toBe('MoodBackground');
  });
});
