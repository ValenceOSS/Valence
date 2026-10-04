import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormattedNumber } from './FormattedNumber';

describe('FormattedNumber', () => {
  it('writes the number it is given', () => {
    render(<FormattedNumber value={1234} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('writes the text around it, straight against it', () => {
    render(<FormattedNumber value={42} prefix="~" suffix=" items" />);

    expect(screen.getByText('~42 items')).toBeInTheDocument();
  });

  it('writes the number in the format it is given', () => {
    render(<FormattedNumber value={0.25} format={{ style: 'percent' }} />);

    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('sets its digits to one width so an updating figure does not shift', () => {
    render(<FormattedNumber value={7} />);

    expect(screen.getByText('7')).toHaveClass('tabular-nums');
  });
});
