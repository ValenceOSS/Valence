import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { SignInCard } from './SignInCard';

const saved = vi.hoisted(() => ({
  saveShowsProfilesBeforeSignIn: vi.fn(() => Promise.resolve(true)),
  saveAllowedApps: vi.fn(() => Promise.resolve(true)),
  saveWayInMessage: vi.fn(() => Promise.resolve(true)),
  saveSplashscreen: vi.fn(() => Promise.resolve({ problem: 'That picture is too big.' })),
  removeSplashscreen: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@ValenceClient/admin/fetchAdmin', () => saved);

describe('SignInCard', () => {
  it('saves whether profiles are listed as it is switched', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<SignInCard overview={anAdminOverview()} />);

    await user.click(screen.getByRole('switch', { name: 'Show profiles' }));

    expect(saved.saveShowsProfilesBeforeSignIn).toHaveBeenCalledWith(true);
  });

  it('says why a background picture was refused, under the setting', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<SignInCard overview={anAdminOverview()} />);

    await user.upload(
      screen.getByLabelText(/^Choose/),
      new File(['x'], 'big.png', { type: 'image/png' }),
    );

    expect(await screen.findByText('That picture is too big.')).toHaveAttribute('role', 'alert');
  });

  it('warns where sign-in is not over HTTPS, naming the addresses allowed', () => {
    renderWithAnswers(<SignInCard overview={anAdminOverview({ cookieSecure: false })} />);

    expect(screen.getByText("Sign-in isn't over HTTPS")).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/localhost:8420/)).toBeInTheDocument();
  });
});
