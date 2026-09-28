import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hero } from './Hero';

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById('download')?.remove();
});

describe('Hero', () => {
  it('says what Valence is', () => {
    render(<Hero />);

    expect(screen.getByRole('heading', { name: /Your films and programmes/ })).toBeInTheDocument();
  });

  it('takes somebody getting started down to the downloads', async () => {
    const downloads = document.createElement('section');
    const scrollIntoView = vi.fn();

    downloads.id = 'download';
    downloads.scrollIntoView = scrollIntoView;
    document.body.append(downloads);

    const user = userEvent.setup();

    render(<Hero />);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it('offers the docs beside it', () => {
    render(<Hero />);

    expect(screen.getByRole('button', { name: 'Read the docs' })).toBeInTheDocument();
  });

  it('names every kind of screen it runs on', () => {
    render(<Hero />);

    for (const platform of [
      'Any browser',
      'iPhone',
      'iPad',
      'Android',
      'Mac',
      'Windows',
      'Linux',
    ]) {
      expect(screen.getByText(platform)).toBeInTheDocument();
    }
  });

  it('shows the web app itself beside the pitch', () => {
    render(<Hero />);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app's home page, with a film in the featured row",
      }),
    ).toHaveAttribute('src', '/devices/web.jpg');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Hero.displayName).toBe('Hero');
  });
});
