import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollRail } from './ScrollRail';

const sized = (width: number, scrollWidth: number) => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => scrollWidth,
  });
};

const aRail = () =>
  render(
    <ScrollRail className="flex">
      <span>one</span>
      <span>two</span>
    </ScrollRail>,
  );

describe('ScrollRail', () => {
  it('shows a track that stays in view while there is more than fits', () => {
    sized(100, 400);

    const { container } = aRail();
    const track = container.querySelector('[aria-hidden]');

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(track).not.toBeNull();
    expect(track?.firstElementChild?.firstElementChild).toHaveStyle({ width: '25.000%' });
  });

  it('shows no track when everything fits', () => {
    sized(400, 400);

    const { container } = aRail();

    expect(container.querySelector('[aria-hidden]')).toBeNull();
  });

  it('scrolls the row sideways as the mouse wheel turns over it', () => {
    sized(100, 400);

    const { container } = aRail();
    const row = container.querySelector('.valence-rail');

    if (row === null) {
      throw new Error('No row was drawn.');
    }

    fireEvent.wheel(row, { deltaY: 60 });

    expect(row.scrollLeft).toBe(60);
  });

  it('holds the row still while what it holds cannot be used', () => {
    sized(100, 400);

    const { container } = render(
      <ScrollRail className="flex" isDisabled>
        <span>one</span>
      </ScrollRail>,
    );
    const row = container.querySelector('.valence-rail');
    const track = container.querySelector('[aria-hidden]');

    if (row === null || track === null) {
      throw new Error('No row or track was drawn.');
    }

    fireEvent.wheel(row, { deltaY: 60 });
    fireEvent.pointerDown(track, { clientX: 90 });

    expect(row.scrollLeft).toBe(0);
    expect(row).toHaveClass('overflow-x-hidden');
  });

  it('moves the row as the thumb is dragged along the track', () => {
    sized(100, 400);

    const { container } = aRail();
    const row = container.querySelector('.valence-rail');
    const thumb = container.querySelector('[aria-hidden] > div > div');

    if (row === null || thumb === null) {
      throw new Error('No track was drawn.');
    }

    fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 10 });
    expect(thumb.parentElement).toHaveClass('h-2.5');

    fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 20 });

    expect(row.scrollLeft).toBe(40);

    fireEvent.pointerUp(thumb, { pointerId: 1 });

    expect(thumb.parentElement).toHaveClass('h-1');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ScrollRail.displayName).toBe('ScrollRail');
  });
});
