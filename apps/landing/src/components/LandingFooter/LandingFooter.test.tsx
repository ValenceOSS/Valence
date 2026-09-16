import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LandingFooter } from './LandingFooter';

describe('LandingFooter', () => {
  it('says what it is licensed under', async () => {
    await renderWithRoutes(LandingFooter);

    expect(screen.getByText(/MIT licensed/)).toBeInTheDocument();
  });

  it('offers a way to the legal pages', async () => {
    await renderWithRoutes(LandingFooter);

    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('opens the project on GitHub in a new tab, rather than leaving this one', async () => {
    await renderWithRoutes(LandingFooter);

    const github = screen.getByRole('link', { name: 'GitHub' });

    expect(github).toHaveAttribute('href', 'https://github.com/MarquesCoding/Valence');
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingFooter.displayName).toBe('LandingFooter');
  });
});
