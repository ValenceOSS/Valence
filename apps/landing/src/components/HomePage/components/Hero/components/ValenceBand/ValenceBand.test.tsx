import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ValenceBand } from './ValenceBand';

describe('ValenceBand', () => {
  it('runs the name across a blue band, out of the way of screen readers', () => {
    const { container } = render(<ValenceBand className="-mt-7" />);

    expect(container.firstElementChild).toHaveClass('bg-accent', '-mt-7');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByText('Valence').length).toBeGreaterThan(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ValenceBand.displayName).toBe('ValenceBand');
  });
});
