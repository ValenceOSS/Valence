import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingPageHero } from './LandingPageHero';

describe('LandingPageHero', () => {
  it('heads the page with its title over the landing site’s own ground', () => {
    const { container } = render(
      <LandingPageHero lead="Brand" description="The mark and its rules." />,
    );

    expect(screen.getByRole('heading', { name: /Brand/ })).toBeInTheDocument();
    expect(container.querySelector('.valence-hero-mark')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingPageHero.displayName).toBe('LandingPageHero');
  });
});
