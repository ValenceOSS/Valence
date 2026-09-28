import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Swap } from './Swap';

describe('Swap', () => {
  it('holds both versions in the same place, the second hidden until the feature is acted out', () => {
    render(<Swap from="Copy" to="Copied" delay={120} />);

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Copied')).toHaveClass('opacity-0');
    expect(screen.getByText('Copied')).toHaveStyle({ transitionDelay: '120ms' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Swap.displayName).toBe('Swap');
  });
});
