import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Reveal } from './Reveal';

describe('Reveal', () => {
  it('shows what it holds', () => {
    render(<Reveal>Arrival</Reveal>);

    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  it('carries the class it is given', () => {
    render(<Reveal className="mt-4">Arrival</Reveal>);

    expect(screen.getByText('Arrival')).toHaveClass('mt-4');
  });
});
