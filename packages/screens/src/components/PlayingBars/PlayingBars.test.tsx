import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as Motion from '@ValenceClient/shell/useMotion';
import { PlayingBars } from './PlayingBars';

const motion = vi.hoisted(() => ({ motion: 'system' }));

vi.mock('@ValenceClient/shell/useMotion', async (original) => {
  const real = await original<typeof Motion>();

  return {
    ...real,
    useMotion: () => ({
      motion: motion.motion,
      choose: vi.fn(),
    }),
  };
});

const barsOf = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('span[aria-hidden] > span'),
];

afterEach(() => {
  motion.motion = 'system';
});

describe('PlayingBars', () => {
  it('stands four quiet bars together while nothing plays', () => {
    const mine = render(<PlayingBars isPlaying={false} />);

    const bars = barsOf(mine.container);

    expect(bars).toHaveLength(4);
    expect(mine.container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');

    for (const bar of bars) {
      expect(bar).not.toHaveClass('valence-bars');
      expect(bar.style.animation).toBe('');
    }
  });

  it('rises and falls out of step with itself while the song plays', () => {
    const mine = render(<PlayingBars isPlaying />);

    const bars = barsOf(mine.container);
    const beats = bars.map((bar) => bar.style.animationDuration);

    expect(beats).toEqual(['520ms', '380ms', '610ms', '450ms']);
    expect(bars.map((bar) => bar.style.animationDelay)).toEqual([
      '0ms',
      '-96ms',
      '-192ms',
      '-288ms',
    ]);

    for (const bar of bars) {
      expect(bar).toHaveClass('valence-bars');
    }
  });

  it('stands still halfway up when motion is reduced', () => {
    motion.motion = 'reduced';
    const mine = render(<PlayingBars isPlaying />);

    const bars = barsOf(mine.container);

    for (const bar of bars) {
      expect(bar).not.toHaveClass('valence-bars');
      expect(bar.style.transform).toBe('scaleY(0.65)');
    }
  });

  it('keeps standing low once a song has stopped when motion is reduced', () => {
    motion.motion = 'reduced';
    const mine = render(<PlayingBars isPlaying={false} />);

    for (const bar of barsOf(mine.container)) {
      expect(bar.style.transform).toBe('scaleY(0.3)');
    }
  });

  it('animates when motion is full even if OS prefers reduced', () => {
    motion.motion = 'full';
    const mine = render(<PlayingBars isPlaying />);

    const bars = barsOf(mine.container);

    for (const bar of bars) {
      expect(bar).toHaveClass('valence-bars');
    }
  });

  it('takes the colour and the size it is handed', () => {
    const mine = render(<PlayingBars isPlaying={false} colour="#ff7700" size={28} />);

    const bars = barsOf(mine.container);
    const stand = bars[0]?.parentElement;

    expect(stand?.style.width).toBe('28px');
    expect(stand?.style.height).toBe('28px');
    expect(bars.every((bar) => bar.style.backgroundColor === 'rgb(255, 119, 0)')).toBe(true);
    expect(bars.every((bar) => bar.style.width === '4px')).toBe(true);
  });
});
