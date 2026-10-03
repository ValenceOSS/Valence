import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandGlyph } from './BrandGlyph';

describe('BrandGlyph', () => {
  it('draws the mark it is asked for through a mask, so it wears the colour of its text', () => {
    const { container } = render(<BrandGlyph of="chrome" />);
    const glyph = container.firstElementChild;

    expect(glyph?.getAttribute('style')).toContain('Google%20Chrome');
    expect(glyph).toHaveClass('bg-current');
  });

  it('is hidden from a screen reader where the words beside it already say it', () => {
    const { container } = render(<BrandGlyph of="safari" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('stands as an image with a name where it is given one', () => {
    render(<BrandGlyph of="firefox" label="Firefox" />);

    expect(screen.getByRole('img', { name: 'Firefox' })).toBeInTheDocument();
  });

  it('takes its size in rem, so it grows with the text around it', () => {
    const { container } = render(<BrandGlyph of="linux" size={24} />);

    expect(container.firstElementChild).toHaveAttribute(
      'style',
      expect.stringContaining('width: 1.5rem'),
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandGlyph.displayName).toBe('BrandGlyph');
  });
});
