import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { markTourSeen } from '@ValenceScreens/tour/tourPreference';
import { GetStartedHost } from './GetStartedHost';

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

const LIST = { name: 'Get started with Valence' };

describe('GetStartedHost', () => {
  it('shows somebody new the list of things worth doing first', () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    expect(screen.getByRole('complementary', LIST)).toBeInTheDocument();
    expect(screen.getByText('Add a profile picture')).toBeInTheDocument();
  });

  it('does not show it to an administrator', () => {
    may.mayAdminister = true;

    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    expect(screen.queryByRole('complementary', LIST)).not.toBeInTheDocument();
  });

  it('waits to know who it is showing it to', () => {
    may.isLoading = true;

    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    expect(screen.queryByRole('complementary', LIST)).not.toBeInTheDocument();
  });

  it('does not show it to somebody who went through the older tour', () => {
    markTourSeen('account-1');

    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    expect(screen.queryByRole('complementary', LIST)).not.toBeInTheDocument();
  });

  it('marks a step skipped', async () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.getByText('Add a profile picture')).toHaveClass('line-through');
  });

  it('marks a step done once it is taken', async () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    await userEvent.click(screen.getByRole('button', { name: 'Choose a picture' }));

    expect(screen.getByText('Add a profile picture')).toHaveClass('line-through');
  });

  it('folds the list away', async () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    await userEvent.click(screen.getByRole('button', LIST));

    expect(screen.queryByText('Make it yours')).not.toBeInTheDocument();
  });

  it('goes away for good once put away', async () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    await userEvent.click(screen.getByRole('button', { name: 'Skip all' }));

    expect(screen.queryByRole('complementary', LIST)).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GetStartedHost.displayName).toBe('GetStartedHost');
  });
});
