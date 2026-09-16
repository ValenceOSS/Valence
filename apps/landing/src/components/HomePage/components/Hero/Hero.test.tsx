import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hero } from './Hero';

vi.mock('@paper-design/shaders-react', () => ({
  ShaderMount: () => <div data-testid="shader-mount" />,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Hero', () => {
  it('says what Valence is', () => {
    render(<Hero />);

    expect(screen.getByRole('heading', { name: /Your films and programmes/ })).toBeInTheDocument();
  });

  it('offers a way to get started', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    render(<Hero />);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(open).toHaveBeenCalledWith(
      'https://github.com/MarquesCoding/Valence',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows the app itself alongside the pitch', () => {
    render(<Hero />);

    expect(
      screen.getByRole('img', {
        name: "The Valence web app open on a title's page, with the continue-watching rail beneath it",
      }),
    ).toHaveAttribute('src', '/hero.jpeg');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Hero.displayName).toBe('Hero');
  });
});
