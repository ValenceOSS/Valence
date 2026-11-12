import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PictureFramer } from './PictureFramer';

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
  const picture = drawn.container.querySelector('img');
  const box = screen.getByRole('group', { name: 'Where the picture sits' });

  if (picture === null) {
    throw new Error('No picture was drawn.');
  }

  Object.defineProperty(picture, 'naturalWidth', { configurable: true, value: 2000 });
  Object.defineProperty(picture, 'naturalHeight', { configurable: true, value: 1000 });
  fireEvent.load(picture);
  box.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 100, height: 100 });

  return { box, onFrame };
};

describe('PictureFramer', () => {
  it('brings more of the left into view as the picture is dragged right', () => {
    const { box, onFrame } = aFramer();

    fireEvent.pointerDown(box, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 75, clientY: 50 });
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

  it('is drawn as a circle where asked, and can be reached from the keyboard', () => {
    const { box } = aFramer();

    expect(box).toHaveClass('rounded-full');
    expect(box).toHaveAttribute('tabindex', '0');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PictureFramer.displayName).toBe('PictureFramer');
  });
});
