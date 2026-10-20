import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { markTourSeen } from '@ValenceScreens/tour/tourPreference';
import { GetStartedHost } from './GetStartedHost';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';

const may = vi.hoisted(() => ({ mayAdminister: false, isLoading: false }));
const standing = vi.hoisted(() => ({ now: 'mayAddAPasskey' }));

vi.mock('@ValenceScreens/passkeys/useSignInStanding', () => ({
  useSignInStanding: () => standing.now,
}));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may: () => false, ...may }),
}));

beforeEach(() => {
  standing.now = 'mayAddAPasskey';
  may.mayAdminister = false;
  may.isLoading = false;
});

afterEach(() => {
  window.localStorage.clear();
});

const LIST = { name: 'Get started with Valence' };

const aWatcher = (isOwner: boolean): ViewerProfile => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Dan',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

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

  it('leaves the picture step open after going to choose one, until one is set', async () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />, {
      watcher: aWatcher(false),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Choose a picture' }));

    expect(screen.getByText('Add a profile picture')).not.toHaveClass('line-through');
  });

  it('marks the picture step done once the profile has a picture', () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />, {
      watcher: { ...aWatcher(false), avatar: { kind: 'photo', isVideo: false, frame: null } },
    });

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

  it('asks the owner to add who watches and a passkey', () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />, {
      watcher: aWatcher(true),
    });

    expect(screen.getByText('Add who watches with you')).toBeInTheDocument();
    expect(screen.getByText('Sign in with a passkey')).toBeInTheDocument();
  });

  it('counts a passkey the account already holds as done', () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />, {
      watcher: aWatcher(true),
    });

    const before = screen.getByText(/completed/).textContent;

    standing.now = 'hasPasskey';
    window.localStorage.clear();
    renderInAShell(<GetStartedHost accountId="account-2" name="Valence" />, {
      watcher: aWatcher(true),
    });

    const [, after] = screen.getAllByText(/completed/);

    expect(Number.parseInt(after?.textContent ?? '', 10)).toBe(
      Number.parseInt(before ?? '', 10) + 1,
    );
  });

  it('asks nobody else on the account for what only the owner can change', () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />, {
      watcher: aWatcher(false),
    });

    expect(screen.getByText('Add a profile picture')).toBeInTheDocument();
    expect(screen.queryByText('Add who watches with you')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign in with a passkey')).not.toBeInTheDocument();
  });

  it('puts itself away once the last step left is skipped', async () => {
    renderInAShell(<GetStartedHost accountId="account-1" name="Valence" />);

    for (
      let skip = screen.queryAllByRole('button', { name: 'Skip' })[0];
      skip !== undefined;
      skip = screen.queryAllByRole('button', { name: 'Skip' })[0]
    ) {
      await userEvent.click(skip);
    }

    expect(screen.queryByRole('complementary', LIST)).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(GetStartedHost.displayName).toBe('GetStartedHost');
  });
});
