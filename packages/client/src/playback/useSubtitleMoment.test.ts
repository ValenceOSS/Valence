import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubtitleMoment } from './useSubtitleMoment';
import type { SubtitleCue } from './fetchSubtitleCues';

const aCue = (from: number, to: number): SubtitleCue => ({
  from,
  to,
  spans: [
    {
      text: 'A line',
      fontFamily: null,
      fontHeight: null,
      colour: null,
      opacity: null,
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      isStruckThrough: false,
    },
  ],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
});

const CUES = [aCue(10, 12), aCue(20, 22)];

const holding = (position: number, isPlaying: boolean, cues: readonly SubtitleCue[] = CUES) =>
  renderHook((props) => useSubtitleMoment(props.cues, props.position, props.isPlaying), {
    initialProps: { cues, position, isPlaying },
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSubtitleMoment', () => {
  it('is where the player last said, until anything else happens', () => {
    const held = holding(5, false);

    expect(held.result.current).toBe(5);
  });

  it('steps on to a line starting between two reports, at the moment it starts', () => {
    const held = holding(19.6, true);

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(held.result.current).toBe(19.6);

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(held.result.current).toBe(20);
  });

  it('steps on to where a line ends, so a short one is taken down on time', () => {
    const held = holding(11.5, true);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(held.result.current).toBe(12);
  });

  it('runs no more than a second past the last report, so a stalled picture keeps its words', () => {
    const held = holding(18.5, true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(held.result.current).toBe(18.5);
  });

  it('stands still while the film is paused', () => {
    const held = holding(19.6, false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(held.result.current).toBe(19.6);
  });

  it('takes the next report as it comes, ahead of or behind where it had stepped to', () => {
    const held = holding(19.6, true);

    act(() => {
      vi.advanceTimersByTime(450);
    });

    expect(held.result.current).toBe(20);

    held.rerender({ cues: CUES, position: 3, isPlaying: true });

    expect(held.result.current).toBe(3);
  });

  it('has nothing to step to after the last line', () => {
    const held = holding(30, true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(held.result.current).toBe(30);
  });

  it('settles on a moment the player cannot yet say, rather than asking again forever', () => {
    const held = holding(Number.NaN, true);

    expect(held.result.current).toBeNaN();
  });
});
