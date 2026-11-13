import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ColourPicker } from './ColourPicker';

describe('ColourPicker', () => {
  it('writes out the colour it is given', () => {
    render(<ColourPicker label="Colour" value="#3a8ee8" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Colour: hex code' })).toHaveValue('#3a8ee8');
  });

  it('shows the colour its field starts on where it is given none, rather than nothing', () => {
    const { container } = render(<ColourPicker label="Colour" value="" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Colour: hex code' })).toHaveValue('#ff0000');
    expect(container.querySelector('[aria-hidden].size-8')).toHaveStyle({
      backgroundColor: '#ff0000',
    });
  });

  it('offers no ready colours unless it is given some', () => {
    render(<ColourPicker label="Colour" value="#3a8ee8" onChange={vi.fn()} />);

    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ColourPicker.displayName).toBe('ColourPicker');
  });
});
