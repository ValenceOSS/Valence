import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { LandingNav } from './LandingNav';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LandingNav', () => {
  it('names Valence', async () => {
    await renderWithRoutes(LandingNav);

    expect(screen.getByText('Valence')).toBeInTheDocument();
  });

  it('offers a way to the other pages', async () => {
    await renderWithRoutes(LandingNav);

    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/changelog');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('opens the project on GitHub, in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'View the source on GitHub' }));

    expect(open).toHaveBeenCalledWith(
      'https://github.com/MarquesCoding/Valence',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens the Discord, in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'Join the Discord' }));

    expect(open).toHaveBeenCalledWith(
      'https://discord.gg/uTtcAHMy9N',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('folds the same places and the same social links into a menu for narrow screens', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'Navigation' }));

    expect(screen.getByRole('menuitem', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'View the source on GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Join the Discord' })).toBeInTheDocument();
  });

  it('opens the Discord from the narrow-screen menu too', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'Navigation' }));
    await user.click(screen.getByRole('menuitem', { name: 'Join the Discord' }));

    expect(open).toHaveBeenCalledWith(
      'https://discord.gg/uTtcAHMy9N',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LandingNav.displayName).toBe('LandingNav');
  });
});
