import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LandingNav } from './LandingNav';

describe('LandingNav', () => {
  it('names Valence, with the newest release across the top', async () => {
    await renderWithRoutes(LandingNav);

    expect(screen.getByText('Valence')).toBeInTheDocument();
    expect(screen.getByText('New release')).toBeInTheDocument();
  });

  it('takes this site’s own pages through the router', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.hover(screen.getByRole('button', { name: 'Product' }));

    expect(await screen.findByRole('link', { name: /Features/ })).toHaveAttribute(
      'href',
      '/features',
    );
    expect(screen.getByRole('link', { name: /Download/ })).toHaveAttribute('href', '/downloads');
  });

  it('sends the documentation to the docs site', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.hover(screen.getByRole('button', { name: 'Resources' }));

    expect(await screen.findByRole('link', { name: /Documentation/ })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app',
    );
    expect(
      within(screen.getByRole('region', { name: 'Resources' })).getByRole('link', {
        name: /Changelog/,
      }),
    ).toHaveAttribute('href', '/changelog');
  });

  it('folds the same places into a menu for narrow screens', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'Navigation' }));
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });

    expect(within(mobileNav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(mobileNav).getByRole('link', { name: /Changelog/ })).toHaveAttribute(
      'href',
      '/changelog',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingNav.displayName).toBe('LandingNav');
  });
});
