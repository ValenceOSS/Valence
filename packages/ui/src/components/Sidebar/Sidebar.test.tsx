import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Home as HomeIcon } from '@keyline-icons/react';
import { Sidebar } from './Sidebar';

const GROUPS = [
  {
    label: 'Activity',
    items: [
      { id: 'sessions', label: 'Sessions', icon: HomeIcon },
      { id: 'jobs', label: 'Jobs', icon: HomeIcon },
    ],
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * jsdom draws nothing, so where the list and the current item are is described: the list as a
 * window 100 to 500 high, and the item wherever the test says.
 */
const drawnAt = (item: { top: number; bottom: number }) => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const isCurrent = this.getAttribute('aria-current') === 'page';
    const box = isCurrent ? item : { top: 100, bottom: 500 };

    return { ...box, x: 0, y: box.top, left: 0, right: 0, width: 0, height: 0, toJSON: () => ({}) };
  });
};

const scrollBy = vi.fn();

const laidOut = () => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 400 });
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: scrollBy });
  scrollBy.mockClear();
};

describe('Sidebar', () => {
  it('names the destinations it holds', () => {
    render(<Sidebar label="Admin" groups={GROUPS} value="sessions" onSelect={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jobs' })).toBeInTheDocument();
  });

  it('marks the current destination', () => {
    render(<Sidebar label="Admin" groups={GROUPS} value="jobs" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Jobs' })).toHaveAttribute('aria-current', 'page');
  });

  it('scrolls smoothly to a current destination that is out of view', () => {
    laidOut();
    drawnAt({ top: 700, bottom: 740 });

    render(<Sidebar label="Admin" groups={GROUPS} value="jobs" onSelect={vi.fn()} />);

    expect(scrollBy).toHaveBeenCalledWith({ top: 256, behavior: 'smooth' });
  });

  it('leaves the list alone where the current destination is already in view', () => {
    laidOut();
    drawnAt({ top: 200, bottom: 240 });

    render(<Sidebar label="Admin" groups={GROUPS} value="jobs" onSelect={vi.fn()} />);

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('follows the current destination as it changes', () => {
    laidOut();
    drawnAt({ top: 200, bottom: 240 });

    const { rerender } = render(
      <Sidebar label="Admin" groups={GROUPS} value="sessions" onSelect={vi.fn()} />,
    );

    drawnAt({ top: 900, bottom: 940 });
    rerender(<Sidebar label="Admin" groups={GROUPS} value="jobs" onSelect={vi.fn()} />);

    expect(scrollBy).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Sidebar.displayName).toBe('Sidebar');
  });

  it('does nothing where the list has no height to scroll, such as while it is closed', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 0 });
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
    scrollBy.mockClear();
    drawnAt({ top: 700, bottom: 740 });

    render(<Sidebar label="Admin" groups={GROUPS} value="jobs" onSelect={vi.fn()} />);

    expect(scrollBy).not.toHaveBeenCalled();
  });
});
