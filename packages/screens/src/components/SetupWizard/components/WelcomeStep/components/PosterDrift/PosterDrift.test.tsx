import { render } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { PosterDrift } from './PosterDrift';

describe('PosterDrift', () => {
  it('is hidden from assistive technology, being only a picture', () => {
    const { container } = render(<PosterDrift />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws two rows of posters, each twice over so the drift can loop', () => {
    const { container } = render(<PosterDrift />);
    const rows = container.firstElementChild?.children ?? [];

    expect(rows).toHaveLength(2);

    for (const row of rows) {
      expect(row.children).toHaveLength(18);
    }
  });

  it('still draws the shelves for somebody who asked for less movement', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <PosterDrift />
      </MotionConfig>,
    );

    expect(container.firstElementChild?.children).toHaveLength(2);
  });
});
