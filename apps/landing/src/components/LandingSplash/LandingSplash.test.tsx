import { render, waitFor } from '@testing-library/react';
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

  it('goes after a moment, so it never stands in the way', async () => {
    vi.useRealTimers();

    const { container } = render(<LandingSplash />);

    await waitFor(
      () => {
        expect(container).toBeEmptyDOMElement();
      },
      { timeout: 4000 },
    );
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
