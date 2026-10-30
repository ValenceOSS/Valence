import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TvScene } from './TvScene';

const SLIDES = [
  { src: '/tour/home.jpg', alt: 'The home page' },
  { src: '/tour/library.jpg', alt: 'The library' },
] as const;

describe('TvScene', () => {
  it('shows the chosen picture on the television', () => {
    render(<TvScene slides={SLIDES} active={1} />);

    const shown = screen.getByRole('img', { name: 'The library' });

    expect(shown).toHaveAttribute('src', '/tour/library.jpg');
    expect(shown.getAttribute('srcset')).toContain('/tour/library-1600.webp 1600w');
  });

  it('hides the pictures not showing from assistive technology', () => {
    render(<TvScene slides={SLIDES} active={1} />);

    expect(screen.queryByRole('img', { name: 'The home page' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TvScene.displayName).toBe('TvScene');
  });
});
