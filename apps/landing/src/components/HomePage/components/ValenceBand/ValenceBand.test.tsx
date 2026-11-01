import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { ValenceBand } from './ValenceBand';

describe('ValenceBand', () => {
  it('runs the name across a blue band, out of the way of screen readers', () => {
    const { container } = render(<ValenceBand className="-mt-7" />);

    expect(container.firstElementChild).toHaveClass('bg-accent', '-mt-7');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByText('Valence').length).toBeGreaterThan(0);
  });

  it('turns over to blue on white in a circle that swells in after the mouse and shrinks away on leaving', async () => {
    const { container } = render(<ValenceBand />);
    const band = container.firstElementChild;
    const lens = band?.lastElementChild;

    if (!(band instanceof HTMLElement) || !(lens instanceof HTMLElement)) {
      throw new Error('The band drew no circle');
    }

    vi.spyOn(band, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 800, 100));

    expect(lens).toHaveClass('bg-accent-contrast', 'text-accent');

    fireEvent.pointerEnter(band, { pointerType: 'mouse', clientX: 30, clientY: 20 });
    fireEvent.pointerMove(band, { pointerType: 'mouse', clientX: 30, clientY: 20 });

    await waitFor(() => {
      expect(lens.style.clipPath).toMatch(/^circle\((?!0px)/u);
    });
    expect(lens.style.clipPath).toContain('at 30px 50px');

    fireEvent.pointerLeave(band);

    await waitFor(() => {
      expect(lens.style.clipPath).toMatch(/^circle\(0px/u);
    });
  });

  it('opens no circle for a finger', () => {
    const { container } = render(<ValenceBand />);
    const band = container.firstElementChild;
    const lens = band?.lastElementChild;

    if (band === null || !(lens instanceof HTMLElement)) {
      throw new Error('The band drew no circle');
    }

    fireEvent.pointerMove(band, { pointerType: 'touch', clientX: 30, clientY: 20 });

    expect(lens.style.clipPath).toMatch(/^circle\(0px/u);
  });

  it('draws no circle for somebody who asked for stillness', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <ValenceBand />
      </MotionConfig>,
    );

    expect(container.querySelector('.bg-accent-contrast')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ValenceBand.displayName).toBe('ValenceBand');
  });
});
