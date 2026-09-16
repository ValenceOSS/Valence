import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LandingShell } from './LandingShell';

vi.mock('@paper-design/shaders-react', () => ({
  ShaderMount: () => <div data-testid="shader-mount" />,
}));

describe('LandingShell', () => {
  it('draws the nav and the footer around the page', async () => {
    await renderWithRoutes(LandingShell);

    expect(screen.getByRole('navigation', { name: 'Valence' })).toBeInTheDocument();
    expect(screen.getByText(/MIT licensed/)).toBeInTheDocument();
  });

  it('draws whichever page the address names', async () => {
    await renderWithRoutes(LandingShell, '/changelog');

    expect(await screen.findByRole('heading', { name: 'Changelog' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingShell.displayName).toBe('LandingShell');
  });
});
