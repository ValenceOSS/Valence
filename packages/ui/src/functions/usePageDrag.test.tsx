import { act, fireEvent, render, screen } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageDrag } from './usePageDrag';
import type { MotionValue } from 'motion/react';

type Options = {
  travel?: MotionValue<number>;
  isMouseAllowed?: boolean;
  mayMove?: (towards: -1 | 1) => boolean;
  onRelease: (offset: number, velocity: number) => void;
  onClick?: () => void;
};

const Page = ({ travel, isMouseAllowed = false, mayMove, onRelease, onClick }: Options) => {
  const handlers = usePageDrag({
    ...(travel === undefined ? {} : { travel }),
    isOn: true,
    isMouseAllowed,
    reach: () => 300,
    mayMove: mayMove ?? (() => true),
    onRelease,
  });

  return (
    <div data-testid="page" {...handlers}>
      <span onClick={onClick}>Page</span>
    </div>
  );
};

const pointer = (pointerType = 'touch') => ({
  pointerId: 1,
  isPrimary: true,
  pointerType,
  button: 0,
});

const swipe = (page: HTMLElement, to: { x: number; y: number }, pointerType = 'touch') => {
  fireEvent.pointerDown(page, { ...pointer(pointerType), clientX: 200, clientY: 100 });
  fireEvent.pointerMove(page, {
    ...pointer(pointerType),
    clientX: 200 + to.x / 2,
    clientY: 100 + to.y / 2,
  });
  fireEvent.pointerMove(page, {
    ...pointer(pointerType),
    clientX: 200 + to.x,
    clientY: 100 + to.y,
  });
  fireEvent.pointerUp(page, { ...pointer(pointerType), clientX: 200 + to.x, clientY: 100 + to.y });
};

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    value: vi.fn(),
    configurable: true,
  });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
  vi.useRealTimers();
});

describe('usePageDrag', () => {
  it('says how far a page was swiped once it is let go', () => {
    const onRelease = vi.fn();

    render(<Page onRelease={onRelease} />);
    swipe(screen.getByTestId('page'), { x: -80, y: 0 });

    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease.mock.calls[0]?.[0]).toBe(-40);
  });

  it('carries the page along with the swipe where it is given somewhere to go', () => {
    const travel = motionValue(0);

    render(<Page travel={travel} onRelease={vi.fn()} />);

    const page = screen.getByTestId('page');

    fireEvent.pointerDown(page, { ...pointer(), clientX: 200, clientY: 100 });
    fireEvent.pointerMove(page, { ...pointer(), clientX: 180, clientY: 100 });
    fireEvent.pointerMove(page, { ...pointer(), clientX: 150, clientY: 100 });

    expect(travel.get()).toBe(-30);
  });

  it('leaves a tap as a tap', () => {
    const onRelease = vi.fn();

    render(<Page onRelease={onRelease} />);
    swipe(screen.getByTestId('page'), { x: 5, y: 0 });

    expect(onRelease).not.toHaveBeenCalled();
  });

  it('lets a movement mostly up or down go on scrolling', () => {
    const onRelease = vi.fn();

    render(<Page onRelease={onRelease} />);
    swipe(screen.getByTestId('page'), { x: 20, y: 60 });

    expect(onRelease).not.toHaveBeenCalled();
  });

  it('leaves a mouse drag to select text where a mouse may not turn the page', () => {
    const onRelease = vi.fn();

    render(<Page onRelease={onRelease} />);
    swipe(screen.getByTestId('page'), { x: -80, y: 0 }, 'mouse');

    expect(onRelease).not.toHaveBeenCalled();
  });

  it('holds the page still where there is nothing further that way', () => {
    const travel = motionValue(0);

    render(<Page travel={travel} mayMove={() => false} onRelease={vi.fn()} />);

    const page = screen.getByTestId('page');

    fireEvent.pointerDown(page, { ...pointer(), clientX: 200, clientY: 100 });
    fireEvent.pointerMove(page, { ...pointer(), clientX: 180, clientY: 100 });
    fireEvent.pointerMove(page, { ...pointer(), clientX: 120, clientY: 100 });

    expect(travel.get()).toBe(0);
  });

  it('swallows the click a swipe ends with', () => {
    const onClick = vi.fn();

    render(<Page onRelease={vi.fn()} onClick={onClick} />);
    swipe(screen.getByTestId('page'), { x: -80, y: 0 });
    fireEvent.click(screen.getByText('Page'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('turns on a two-finger trackpad swipe once it settles', () => {
    vi.useFakeTimers();

    const onRelease = vi.fn();

    render(<Page onRelease={onRelease} />);

    const page = screen.getByTestId('page');

    fireEvent.wheel(page, { deltaX: 30, deltaY: 0 });
    fireEvent.wheel(page, { deltaX: 30, deltaY: 0 });

    expect(onRelease).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease.mock.calls[0]?.[0]).toBe(-60);
  });
});
