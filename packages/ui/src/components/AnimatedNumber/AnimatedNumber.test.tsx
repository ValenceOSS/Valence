import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedNumber } from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('writes the number it is given', () => {
    render(<AnimatedNumber value={1234} />);

    expect(screen.getByText('1,234', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('writes the text around it, straight against it', () => {
    render(<AnimatedNumber value={42} prefix="~" suffix=" items" />);

    expect(screen.getByText('~42 items', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('sets its digits to one width so it does not shudder as it rolls', () => {
    const { container } = render(<AnimatedNumber value={7} className="text-text" />);

    expect(container.firstElementChild).toHaveClass('tabular-nums', 'text-text');
  });

  it('says the number once to a screen reader, not digit by digit', () => {
    const { container } = render(<AnimatedNumber value={7} />);

    expect(container.querySelector('[aria-hidden]')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnimatedNumber.displayName).toBe('AnimatedNumber');
  });
});
