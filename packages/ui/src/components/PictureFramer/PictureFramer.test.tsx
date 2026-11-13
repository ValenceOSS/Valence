import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PictureFramer } from './PictureFramer';

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 100 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get: () => 100,
});

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

const aFramer = (onFrame = vi.fn<(frame: typeof UNFRAMED) => void>(), frame = UNFRAMED) => {
  const drawn = render(
    <PictureFramer
      src="/wide.jpg"
      frame={frame}
      aspect={1}
      mostZoom={4}
      label="Where the picture sits"
      shape="circle"
      onFrame={onFrame}
    />,
  );
  const box = screen.getByRole('group', { name: 'Where the picture sits' });

  for (const picture of drawn.container.querySelectorAll('img')) {
    Object.defineProperty(picture, 'naturalWidth', { configurable: true, value: 2000 });
    Object.defineProperty(picture, 'naturalHeight', { configurable: true, value: 1000 });
    fireEvent.load(picture);
  }

  return { box, onFrame };
};

describe('PictureFramer', () => {
  it('brings more of the left into view as the picture is dragged right', () => {
    const { box, onFrame } = aFramer();

    fireEvent.pointerDown(box, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 70, clientY: 50 });
    fireEvent.pointerUp(box, { pointerId: 1 });

    expect(onFrame).toHaveBeenLastCalledWith({ zoom: 1, x: -0.5, y: 0 });
  });

  it('does nothing as the pointer moves without being held', () => {
    const { box, onFrame } = aFramer();

    fireEvent.pointerMove(box, { pointerId: 1, clientX: 75, clientY: 50 });

    expect(onFrame).not.toHaveBeenCalled();
  });

  it('draws the picture nearer as it is scrolled over, and no nearer than allowed', () => {
    const { box, onFrame } = aFramer();

    fireEvent.wheel(box, { deltaY: -100 });

    expect(onFrame.mock.lastCall?.[0].zoom).toBeGreaterThan(1);

    fireEvent.wheel(box, { deltaY: -100_000 });

    expect(onFrame.mock.lastCall?.[0].zoom).toBe(4);
  });

  it('draws the picture nearer as two fingers pinch apart on a trackpad', () => {
    const { box, onFrame } = aFramer();

    fireEvent.wheel(box, { deltaY: -10.5, ctrlKey: true });

    expect(onFrame.mock.lastCall?.[0].zoom).toBeGreaterThan(1.1);
  });

  it('moves the picture as two fingers move across a trackpad, as a page scrolls', () => {
    const { box, onFrame } = aFramer();

    fireEvent.wheel(box, { deltaX: 8.5, deltaY: 0 });

    expect(onFrame.mock.lastCall?.[0]).toMatchObject({ zoom: 1 });
    expect(onFrame.mock.lastCall?.[0].x).toBeGreaterThan(0);
  });

  it('moves with the arrow keys and draws nearer with plus', () => {
    const { box, onFrame } = aFramer();

    fireEvent.keyDown(box, { key: 'ArrowRight' });

    expect(onFrame.mock.lastCall?.[0].x).toBeGreaterThan(0);

    fireEvent.keyDown(box, { key: '+' });

    expect(onFrame.mock.lastCall?.[0].zoom).toBeCloseTo(1.1);
  });

  it('draws nearer as two fingers pinch apart', () => {
    const { box, onFrame } = aFramer();

    fireEvent.pointerDown(box, { pointerId: 1, clientX: 40, clientY: 50 });
    fireEvent.pointerDown(box, { pointerId: 2, clientX: 60, clientY: 50 });
    fireEvent.pointerMove(box, { pointerId: 2, clientX: 80, clientY: 50 });

    expect(onFrame.mock.lastCall?.[0].zoom).toBe(2);
  });

  it('shows the whole picture faded around the shape it is placed in', () => {
    const { box } = aFramer();
    const [faded, placed] = box.querySelectorAll('img');

    expect(faded).toHaveClass('opacity-30');
    expect(placed?.parentElement).toHaveClass('overflow-hidden', 'rounded-full');
  });

  it('shows the shape asked for in the middle, and can be reached from the keyboard', () => {
    const { box } = aFramer();

    expect(box.querySelector('.rounded-full')).not.toBeNull();
    expect(box).toHaveAttribute('tabindex', '0');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PictureFramer.displayName).toBe('PictureFramer');
  });
});
