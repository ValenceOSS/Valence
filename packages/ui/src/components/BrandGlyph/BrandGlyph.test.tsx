import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BRAND_OPTICS } from '@ValenceUI/tokens/BRAND_OPTICS';
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

  it('moves a mark whose weight sits off the middle of its square, so its weight is centred', () => {
    const middle = BRAND_OPTICS.apple?.middle ?? 0.5;
    const { container } = render(<BrandGlyph of="apple" />);

    expect(middle).not.toBe(0.5);
    expect(container.firstElementChild).toHaveAttribute(
      'style',
      expect.stringContaining(`translate: 0 ${((0.5 - middle) * 100).toFixed(1)}%`),
    );
  });

  it('leaves a mark that sits in the middle of its square where it is', () => {
    const { container } = render(<BrandGlyph of="chrome" />);

    expect(BRAND_OPTICS.chrome).toBeUndefined();
    expect(container.firstElementChild).toHaveAttribute(
      'style',
      expect.stringContaining('translate: 0 0.0%'),
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BrandGlyph.displayName).toBe('BrandGlyph');
  });
});
