import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ValenceBand } from './ValenceBand';

describe('ValenceBand', () => {
  it('runs the name across a blue band, out of the way of screen readers', () => {
    const { container } = render(<ValenceBand className="-mt-7" />);

    expect(container.firstElementChild).toHaveClass('bg-accent', '-mt-7');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByText('Valence').length).toBeGreaterThan(0);
  });

  it('turns over to blue on white in a ring that follows the mouse, and lets it go on leaving', () => {
    const { container } = render(<ValenceBand />);
    const band = container.firstElementChild;
    const lens = band?.lastElementChild;

    if (band === null || !(lens instanceof HTMLElement)) {
      throw new Error('The band drew no ring');
    }

    expect(lens).toHaveClass('bg-accent-contrast', 'text-accent');

    fireEvent.pointerMove(band, { pointerType: 'mouse', clientX: 30, clientY: 20 });

    expect(lens.style.getPropertyValue('--lens-r')).toBe('7rem');
    expect(lens.style.getPropertyValue('--lens-x')).toBe('30px');

    fireEvent.pointerLeave(band);

    expect(lens.style.getPropertyValue('--lens-r')).toBe('0px');
  });

  it('opens no ring for a finger', () => {
    const { container } = render(<ValenceBand />);
    const band = container.firstElementChild;
    const lens = band?.lastElementChild;

    if (band === null || !(lens instanceof HTMLElement)) {
      throw new Error('The band drew no ring');
    }

    fireEvent.pointerMove(band, { pointerType: 'touch', clientX: 30, clientY: 20 });

    expect(lens.style.getPropertyValue('--lens-r')).toBe('');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ValenceBand.displayName).toBe('ValenceBand');
  });
});
