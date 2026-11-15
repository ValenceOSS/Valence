import { render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { StackingMark } from './StackingMark';

describe('StackingMark', () => {
  it('draws the three layers of the mark, base first', () => {
    const { container } = render(<StackingMark />);
    const layers = [...(container.firstElementChild?.children ?? [])];

    expect(layers).toHaveLength(3);
  });

  it('keeps the mark’s own shape, so a height alone sizes it', () => {
    const { container } = render(<StackingMark className="h-4" />);

    expect(container.firstElementChild).toHaveStyle({ aspectRatio: String(140 / 132) });
    expect(container.firstElementChild).toHaveClass('h-4');
  });

  it('is a picture with a name where it is given one', () => {
    render(<StackingMark label="Valence" />);

    expect(screen.getByRole('img', { name: 'Valence' })).toBeInTheDocument();
  });

  it('is hidden from assistive technology where it has no name', () => {
    const { container } = render(<StackingMark />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('is drawn already stacked for somebody who asked for less motion', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <StackingMark />
      </MotionConfig>,
    );
    const layers = [...(container.firstElementChild?.children ?? [])];

    layers.forEach((layer) => {
      expect(layer.getAttribute('style') ?? '').not.toContain('opacity: 0');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StackingMark.displayName).toBe('StackingMark');
  });
});
