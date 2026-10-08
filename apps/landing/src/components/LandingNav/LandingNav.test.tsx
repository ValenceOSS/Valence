import { screen, within } from '@testing-library/react';
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

  it('opens grouped product links from the desktop navigation', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.hover(screen.getByRole('button', { name: 'Product' }));

    expect(await screen.findByRole('link', { name: /Product tour/ })).toHaveAttribute(
      'href',
      '/tour',
    );
    expect(screen.getByRole('link', { name: /How it runs/ })).toHaveAttribute(
      'href',
      '/architecture',
    );
    expect(screen.getByRole('link', { name: /Plugins/ })).toHaveAttribute('href', '/plugins');
    expect(screen.getByRole('link', { name: /Compare/ })).toHaveAttribute('href', '/compare');
  });

  it('opens grouped resource links from the desktop navigation', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.hover(screen.getByRole('button', { name: 'Resources' }));

    expect(await screen.findByRole('link', { name: /Documentation/ })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app',
    );
    expect(screen.getByRole('link', { name: /API reference/ })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/api',
    );
    expect(
      within(screen.getByRole('region', { name: 'Resources' })).getByRole('link', {
        name: /Changelog/,
      }),
    ).toHaveAttribute('href', '/changelog');
  });

  it('slides from one section to the next as the pointer moves along the bar', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.hover(screen.getByRole('button', { name: 'Product' }));
    expect(await screen.findByRole('region', { name: 'Product' })).toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Run it' }));

    expect(await screen.findByRole('region', { name: 'Run it' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run it' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Product' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('still shows a section when the pointer doubles back to it quickly', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.hover(screen.getByRole('button', { name: 'Product' }));
    await screen.findByRole('region', { name: 'Product' });
    await user.hover(screen.getByRole('button', { name: 'Run it' }));
    await user.hover(screen.getByRole('button', { name: 'Product' }));

    expect(await screen.findByRole('link', { name: /Product tour/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Product' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('opens and closes a section by click, for touch and the keyboard', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    const community = screen.getByRole('button', { name: 'Community' });

    community.focus();
    await user.keyboard('{Enter}');
    expect(community).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Enter}');
    expect(community).toHaveAttribute('aria-expanded', 'false');
  });

  it('folds the panel away on escape', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'Resources' }));
    expect(screen.getByRole('button', { name: 'Resources' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Resources' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
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
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });

    expect(within(mobileNav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(mobileNav).getByRole('link', { name: /How it runs/ })).toHaveAttribute(
      'href',
      '/architecture',
    );
    expect(within(mobileNav).getByRole('link', { name: /Changelog/ })).toHaveAttribute(
      'href',
      '/changelog',
    );
    expect(
      within(mobileNav).getByRole('button', { name: 'View the source on GitHub' }),
    ).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: 'Join the Discord' })).toBeInTheDocument();
  });

  it('opens the Discord from the narrow-screen menu too', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    await renderWithRoutes(LandingNav);

    await user.click(screen.getByRole('button', { name: 'Navigation' }));
    await user.click(
      within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('button', {
        name: 'Join the Discord',
      }),
    );

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
