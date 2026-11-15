import { render } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingSplash } from './LandingSplash';

describe('LandingSplash', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the mark and the name once, the first time the site is opened in a tab', () => {
    const { container } = render(<LandingSplash />);

    expect(container).toHaveTextContent('Valence');
    expect(sessionStorage.getItem('valence-splash-seen')).toBe('yes');
  });

  it('sets itself to go after a moment, and forgets that if it is taken away first', () => {
    const { unmount } = render(<LandingSplash />);

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not show again in a tab that has already seen it', () => {
    sessionStorage.setItem('valence-splash-seen', 'yes');

    const { container } = render(<LandingSplash />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not show for somebody who asked for less motion', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <LandingSplash />
      </MotionConfig>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingSplash.displayName).toBe('LandingSplash');
  });
});
