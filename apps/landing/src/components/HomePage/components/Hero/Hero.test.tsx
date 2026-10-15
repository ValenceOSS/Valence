import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { Hero } from './Hero';

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById('download')?.remove();
});

describe('Hero', () => {
  it('says what Valence is', async () => {
    await renderWithRoutes(Hero);

    expect(screen.getByRole('heading', { name: /Your films and programmes/ })).toBeInTheDocument();
  });

  it('takes somebody getting started down to the downloads', async () => {
    const downloads = document.createElement('section');
    const scrollIntoView = vi.fn();

    downloads.id = 'download';
    downloads.scrollIntoView = scrollIntoView;
    document.body.append(downloads);

    const user = userEvent.setup();

    await renderWithRoutes(Hero);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it('offers the docs and the demo from the arrow beside the way to start', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(Hero);

    await user.click(screen.getByRole('button', { name: 'Other ways to start' }));

    expect(await screen.findByText('Read the docs')).toBeInTheDocument();
    expect(screen.getByText('Try the demo')).toBeInTheDocument();
  });

  it('names everything it runs on', async () => {
    await renderWithRoutes(Hero);

    for (const platform of ['Docker', 'Apple', 'Android', 'Windows', 'Linux']) {
      expect(screen.getByRole('img', { name: platform })).toBeInTheDocument();
    }
  });

  it('says it is open source, and always will be', async () => {
    await renderWithRoutes(Hero);

    expect(screen.getByText('open sourced, and always will be')).toBeInTheDocument();
  });

  it('shows the web app itself beside the pitch', async () => {
    await renderWithRoutes(Hero);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app's home page, with a film in the featured row",
      }),
    ).toHaveAttribute('src', '/devices/web.jpg');
  });

  it('takes somebody to every feature', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRoutes(Hero);

    await user.click(screen.getByRole('button', { name: 'See every feature' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/features');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Hero.displayName).toBe('Hero');
  });
});
