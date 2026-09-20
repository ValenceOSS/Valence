import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { markTourSeen } from '@ValenceScreens/tour/tourPreference';
import { WelcomeTourHost } from './WelcomeTourHost';

const may = vi.hoisted(() => ({ mayAdminister: false, isLoading: false }));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may: () => false, ...may }),
}));

beforeEach(() => {
  may.mayAdminister = false;
  may.isLoading = false;
});

afterEach(() => {
  window.localStorage.clear();
});

describe('WelcomeTourHost', () => {
  it('shows the tour to somebody who is not an administrator and has not seen it', () => {
    renderInAnAddress(<WelcomeTourHost accountId="account-1" name="Valence" />);

    expect(screen.getByRole('dialog', { name: 'Welcome to Valence' })).toBeInTheDocument();
  });

  it('does not show it to an administrator', () => {
    may.mayAdminister = true;

    renderInAnAddress(<WelcomeTourHost accountId="account-1" name="Valence" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('waits to know who it is showing it to', () => {
    may.isLoading = true;

    renderInAnAddress(<WelcomeTourHost accountId="account-1" name="Valence" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show it again to somebody who has seen it', () => {
    markTourSeen('account-1');

    renderInAnAddress(<WelcomeTourHost accountId="account-1" name="Valence" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('counts skipping as having seen it', async () => {
    renderInAnAddress(<WelcomeTourHost accountId="account-1" name="Valence" />);

    await userEvent.click(screen.getByRole('button', { name: 'Skip tour' }));

    expect(window.localStorage.getItem('valence.tourSeenBy')).toContain('account-1');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WelcomeTourHost.displayName).toBe('WelcomeTourHost');
  });
});
