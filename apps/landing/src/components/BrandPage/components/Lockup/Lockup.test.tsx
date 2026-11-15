import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Lockup } from './Lockup';

describe('Lockup', () => {
  it('sets the name beside the mark, standing on one baseline a quarter of the type apart', () => {
    const { container } = render(<Lockup markColour="#0066FF" wordColour="#FFFFFF" />);

    expect(screen.getByText('Valence')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('items-baseline', 'gap-[0.25em]');
  });

  it('draws the mark and the name each in their own colour', () => {
    const { container } = render(<Lockup markColour="#0066FF" wordColour="#161616" />);
    const [mark, word] = [...(container.firstElementChild?.children ?? [])];

    expect(mark).toHaveStyle({ color: '#0066FF' });
    expect(word).toHaveStyle({ color: '#161616' });
  });

  it('stands the mark over the name when stacked', () => {
    const { container } = render(<Lockup markColour="#0066FF" wordColour="#FFFFFF" isStacked />);

    expect(container.firstElementChild).toHaveClass('flex-col', 'items-center');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Lockup.displayName).toBe('Lockup');
  });
});
