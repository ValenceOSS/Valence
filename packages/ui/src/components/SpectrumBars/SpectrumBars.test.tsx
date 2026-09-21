import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpectrumBars } from './SpectrumBars';
import type * as MotionReact from 'motion/react';

const reduced = vi.hoisted(() => ({ value: false }));

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof MotionReact>('motion/react');

  return { ...actual, useReducedMotionConfig: () => reduced.value };
});

const context = {
  clearRect: vi.fn(),
  fillRect: vi.fn<(x: number, y: number, width: number, height: number) => void>(),
  setTransform: vi.fn(),
  fillStyle: '',
  globalAlpha: 1,
};

const getContext = vi.fn(() => context);

const frames: (() => void)[] = [];

const runFrames = (count: number) => {
  for (let index = 0; index < count; index += 1) {
    frames.shift()?.();
  }
};

beforeEach(() => {
  reduced.value = false;
  frames.length = 0;
  context.clearRect.mockClear();
  context.fillRect.mockClear();
  getContext.mockClear();

  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    configurable: true,
    value: 560,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    configurable: true,
    value: 200,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: getContext,
  });

  vi.stubGlobal('ResizeObserver', undefined);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((frame: () => void) => frames.push(frame)),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SpectrumBars', () => {
  it('draws a bar for every one it was asked to read, as loud as it was told', () => {
    const read = vi.fn((bars: number) => Array.from({ length: bars }, () => 1));

    render(<SpectrumBars read={read} isPlaying bars={8} />);
    runFrames(1);

    expect(read).toHaveBeenCalledWith(8);
    expect(context.fillRect).toHaveBeenCalledTimes(8);
  });

  it('rises toward a loud sound rather than jumping to it', () => {
    render(
      <SpectrumBars read={(bars) => Array.from({ length: bars }, () => 1)} isPlaying bars={1} />,
    );
    runFrames(1);

    const [, , , first] = context.fillRect.mock.calls[0] ?? [];

    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(200);
  });

  it('does not listen for sound that is not playing', () => {
    const read = vi.fn((bars: number) => Array.from({ length: bars }, () => 1));

    render(<SpectrumBars read={read} isPlaying={false} bars={4} />);
    runFrames(1);

    expect(read).not.toHaveBeenCalled();
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  it('stops drawing once the bars have settled, when nothing is playing', () => {
    render(<SpectrumBars read={() => []} isPlaying={false} bars={4} />);
    runFrames(1);

    expect(frames).toHaveLength(0);
  });

  it('keeps drawing while sound is playing, even in silence', () => {
    render(<SpectrumBars read={() => []} isPlaying bars={4} />);
    runFrames(1);

    expect(frames).toHaveLength(1);
  });

  it('draws nothing where movement should be reduced', () => {
    reduced.value = true;

    render(<SpectrumBars read={() => [1]} isPlaying bars={4} />);

    expect(getContext).not.toHaveBeenCalled();
  });

  it('hides itself from a screen reader, since it says nothing that is not already said', () => {
    const { container } = render(<SpectrumBars read={() => []} isPlaying={false} />);

    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SpectrumBars.displayName).toBe('SpectrumBars');
  });
});
