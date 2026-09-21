import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisualiserStage } from './VisualiserStage';

const context = { setTransform: vi.fn() };

const getContext = vi.fn((): typeof context | null => context);

const frames: ((now: number) => void)[] = [];

const cancel = vi.fn();

beforeEach(() => {
  frames.length = 0;
  context.setTransform.mockClear();
  cancel.mockClear();

  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    configurable: true,
    value: 640,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    configurable: true,
    value: 360,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: getContext,
  });

  vi.stubGlobal('ResizeObserver', undefined);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((frame: (now: number) => void) => frames.push(frame)),
  );
  vi.stubGlobal('cancelAnimationFrame', cancel);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('VisualiserStage', () => {
  it('is hidden from assistive technology, being only a picture', () => {
    const { container } = render(<VisualiserStage draw={vi.fn()} />);

    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is sized to the canvas at the screen’s sharpness', () => {
    vi.stubGlobal('devicePixelRatio', 2);

    const { container } = render(<VisualiserStage draw={vi.fn()} />);
    const canvas = container.querySelector('canvas');

    expect(canvas?.width).toBe(1280);
    expect(canvas?.height).toBe(720);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('paints a frame with the size, the time run and the time since the last', () => {
    const draw = vi.fn();

    render(<VisualiserStage draw={draw} />);
    frames.shift()?.(1000);
    frames.shift()?.(1016);

    expect(draw).toHaveBeenNthCalledWith(
      1,
      context,
      { width: 640, height: 360 },
      { seconds: 0, delta: 0 },
    );
    expect(draw).toHaveBeenNthCalledWith(
      2,
      context,
      { width: 640, height: 360 },
      { seconds: 0.016, delta: 0.016 },
    );
  });

  it('counts a frame that was a long time coming as a short one', () => {
    const draw = vi.fn();

    render(<VisualiserStage draw={draw} />);
    frames.shift()?.(1000);
    frames.shift()?.(9000);

    expect(draw).toHaveBeenLastCalledWith(
      context,
      { width: 640, height: 360 },
      { seconds: 8, delta: 0.1 },
    );
  });

  it('stops painting when it goes', () => {
    const { unmount } = render(<VisualiserStage draw={vi.fn()} />);

    unmount();

    expect(cancel).toHaveBeenCalled();
  });

  it('draws nothing where the browser gives no context', () => {
    getContext.mockReturnValueOnce(null);

    const draw = vi.fn();

    render(<VisualiserStage draw={draw} />);

    expect(frames).toHaveLength(0);
    expect(draw).not.toHaveBeenCalled();
  });
});
