import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('opens with the hero', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.getByRole('heading', { name: /Your films and programmes/ })).toBeInTheDocument();
  });

  it('draws every feature group', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.getByRole('region', { name: 'Viewing' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Platform' })).toBeInTheDocument();
  });

  it('shows the app itself within the hero', async () => {
    await renderWithRoutes(HomePage);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app's home page, with a film in the featured row",
      }),
    ).toHaveAttribute('src', '/devices/web.jpg');
  });

  it('makes a statement about who the data belongs to', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.getByRole('region', { name: 'On your data' })).toBeInTheDocument();
  });

  it('shows the newest releases, and ends asking whether you are ready', async () => {
    await renderWithRoutes(HomePage);

    expect(screen.getByRole('region', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Get started' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomePage.displayName).toBe('HomePage');
  });
});
