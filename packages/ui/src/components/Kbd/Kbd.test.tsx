import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('draws each key of a shortcut as a key of its own, in order', () => {
    const { container } = render(<Kbd keys={['⌘', 'K']} />);

    expect([...container.querySelectorAll('kbd')].map((key) => key.textContent)).toEqual([
      '⌘',
      'K',
    ]);
  });

  it('draws smaller keys inside a field', () => {
    render(<Kbd keys={['K']} size="sm" />);

    expect(screen.getByText('K')).toHaveClass('min-w-4');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Kbd.displayName).toBe('Kbd');
  });
});
