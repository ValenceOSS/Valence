import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { HomeHero } from './HomeHero';

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById('download')?.remove();
});

describe('HomeHero', () => {
  it('says what Valence is in one line', async () => {
    await renderWithRoutes(HomeHero);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Your films, shows, music and books, on your own server.',
      }),
    ).toBeInTheDocument();
  });

  it('says it is free, open source and yours beneath the heading', async () => {
    await renderWithRoutes(HomeHero);

    expect(screen.getByText(/Free, open source, and yours\./u)).toBeInTheDocument();
  });

  it('leads to the newest release', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRoutes(HomeHero);
    const newest = CHANGELOG[0];

    await user.click(
      screen.getByRole('link', { name: new RegExp(`New ${newest?.version ?? ''}`, 'u') }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/changelog/${newest?.slug ?? ''}`);
    });
  });

  it('takes somebody getting started down to the downloads', async () => {
    const downloads = document.createElement('section');
    const scrollIntoView = vi.fn();

    downloads.id = 'download';
    downloads.scrollIntoView = scrollIntoView;
    document.body.append(downloads);

    const user = userEvent.setup();

    await renderWithRoutes(HomeHero);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it('offers the demo beside the way to start', async () => {
    await renderWithRoutes(HomeHero);

    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeInTheDocument();
  });

  it('shows the web app itself in a window', async () => {
    await renderWithRoutes(HomeHero);

    const app = screen.getByRole('img', {
      name: "The Valence web app's home page, with a film in the featured row",
    });

    expect(app).toHaveAttribute('src', '/devices/web.jpg');
    expect(app.getAttribute('srcset')).toContain('/devices/web-1600.webp 1600w');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomeHero.displayName).toBe('HomeHero');
  });
});
