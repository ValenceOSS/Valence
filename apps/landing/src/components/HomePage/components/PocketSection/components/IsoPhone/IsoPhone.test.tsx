import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IsoPhone } from './IsoPhone';

const SCREENS = [
  { src: '/phones/home.jpg', alt: 'Home' },
  { src: '/phones/books.jpg', alt: 'Books' },
] as const;

describe('IsoPhone', () => {
  it('shows the chosen screen and hides the rest from a screen reader', () => {
    render(<IsoPhone screens={SCREENS} active={1} />);

    expect(screen.getByRole('img', { name: 'Books' })).toHaveClass('opacity-100');
    expect(screen.queryByRole('img', { name: 'Home' })).not.toBeInTheDocument();
  });

  it('lies at the isometric angle of the figures', () => {
    const { container } = render(<IsoPhone screens={SCREENS} active={0} />);

    expect(container.querySelector('[style*="rotateX(56deg)"]')).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(IsoPhone.displayName).toBe('IsoPhone');
  });
});
