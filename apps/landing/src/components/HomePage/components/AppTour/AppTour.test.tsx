import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppTour } from './AppTour';

describe('AppTour', () => {
  it('opens on the home page, saying what it is for', () => {
    render(<AppTour />);

    expect(screen.getByRole('img', { name: /The home page/ })).toHaveAttribute(
      'src',
      '/tour/home.jpg',
    );
    expect(screen.getByText(/something picked out for tonight/)).toBeInTheDocument();
  });

  it('shows the place chosen from the bar, and says what that place is for', async () => {
    const user = userEvent.setup();

    render(<AppTour />);

    await user.click(screen.getAllByRole('button', { name: 'Music' })[0] ?? document.body);

    expect(await screen.findByRole('img', { name: /An album/ })).toHaveAttribute(
      'src',
      '/tour/music.jpg',
    );
    expect(screen.getByText(/mixes made from what you play/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AppTour.displayName).toBe('AppTour');
  });
});
