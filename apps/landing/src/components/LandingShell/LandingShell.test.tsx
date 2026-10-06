import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LandingShell } from './LandingShell';

describe('LandingShell', () => {
  it('draws the nav and the footer around the page', async () => {
    await renderWithRoutes(LandingShell);

    expect(screen.getByRole('navigation', { name: 'Valence' })).toBeInTheDocument();
    expect(screen.getByText(/MIT licensed/)).toBeInTheDocument();
  });

  it('draws whichever page the address names', async () => {
    await renderWithRoutes(LandingShell, '/changelog');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'What is new in Valence' }),
    ).toBeInTheDocument();
  });

  it('draws a release on a page of its own', async () => {
    await renderWithRoutes(LandingShell, '/changelog/the-first-release');

    expect(await screen.findByRole('heading', { name: 'The first release' })).toBeInTheDocument();
  });

  it('draws the plugins page', async () => {
    await renderWithRoutes(LandingShell, '/plugins');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Add to Valence without handing over the keys',
      }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingShell.displayName).toBe('LandingShell');
  });
});
