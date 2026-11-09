import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import type { Account } from '@ValenceClient/admin/fetchAccounts';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';
import { SessionCards } from './SessionCards';

const ACCOUNT: Account = {
  id: 'account-1',
  name: 'Dan',
  username: 'dan',
  discordId: null,
  email: 'dan@valence.local',
  canSignIn: true,
  lastSignedInAt: null,
  setup: { state: 'none', expiresAt: null },
  createdAt: '',
  isBanned: false,
  banReason: null,
  position: 100,
  isAdministrator: false,
  face: null,
  roles: ['Member'],
};

vi.mock(import('@ValenceClient/admin/fetchAccounts'), async (importOriginal) => ({
  ...(await importOriginal()),
  fetchAccounts: () => Promise.resolve([ACCOUNT]),
}));

const LISTENING = anActiveSession({
  deviceLabel: 'Kitchen speaker',
  listening: {
    trackId: '00000000-0000-4000-8000-000000000001',
    title: 'Caramel',
    artists: ['Sleep Token'],
    albumId: '00000000-0000-4000-8000-000000000002',
    hasArtwork: false,
    isPlaying: true,
    positionSeconds: 65,
    durationSeconds: 290,
    reportedAtMs: 1,
    quality: 'low',
    delivery: 'encoded',
    codec: 'aac',
    kbps: 96,
  },
});

const draw = (
  sessions: ActiveSession[],
  options: { size?: MediaGridSize; canSignOut?: boolean } = {},
) => {
  const calls = {
    onStop: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onMessage: vi.fn(),
    onSignOut: vi.fn(),
  };
  const { onSignOut, ...always } = calls;

  render(
    <SessionCards
      sessions={sessions}
      busyClientId={null}
      {...(options.size === undefined ? {} : { size: options.size })}
      {...always}
      {...(options.canSignOut === true ? { onSignOut } : {})}
    />,
    { wrapper: CacheScope },
  );

  return calls;
};

describe('SessionCards', () => {
  it('says so when nobody has the app open', () => {
    draw([]);

    expect(screen.getByText('No one is using the app right now.')).toBeInTheDocument();
  });

  it('gathers each session under whoever has it open, one lane each', () => {
    draw([
      LISTENING,
      { ...LISTENING, clientId: 'tab-2', deviceLabel: 'Study laptop' },
      { ...LISTENING, clientId: 'tab-3', profileId: 'profile-2', profileName: 'Ruth' },
    ]);

    expect(
      within(screen.getByRole('region', { name: 'Dan' })).getAllByRole('article'),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole('region', { name: 'Ruth' })).getAllByRole('article'),
    ).toHaveLength(1);
  });

  it('draws the face of a viewer whose account it knows, and a plain figure for one it does not', async () => {
    draw([
      LISTENING,
      {
        ...LISTENING,
        clientId: 'tab-3',
        accountId: 'account-2',
        profileId: 'profile-2',
        profileName: 'Ruth',
      },
    ]);

    expect(
      await within(screen.getByRole('region', { name: 'Dan' })).findByText('D'),
    ).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Ruth' })).queryByText('R')).toBeNull();
  });

  it('draws each card at the width asked for', () => {
    draw([LISTENING], { size: 'large' });

    expect(screen.getByRole('article').parentElement).toHaveStyle({
      width: 'min(29.375rem, 100%)',
    });
  });

  it('hands the session on when one is paused or stopped, and says why music takes no message', async () => {
    const user = userEvent.setup();
    const calls = draw([LISTENING]);

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await user.click(screen.getByRole('button', { name: 'Stop' }));

    expect(calls.onPause).toHaveBeenCalledWith('tab-1');
    expect(calls.onStop).toHaveBeenCalledWith('tab-1');
    expect(
      screen.getByRole('button', { name: 'Messages show only while they’re watching a video.' }),
    ).toBeDisabled();
  });

  it('hands the session on when a paused one is let carry on', async () => {
    const user = userEvent.setup();
    const { listening } = LISTENING;

    if (listening === null) {
      throw new Error('The fixture is listening.');
    }

    const calls = draw([{ ...LISTENING, listening: { ...listening, isPlaying: false } }]);

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(calls.onResume).toHaveBeenCalledWith('tab-1');
  });

  it('hands the session on to be signed out', async () => {
    const user = userEvent.setup();
    const calls = draw([LISTENING], { canSignOut: true });

    await user.click(screen.getByRole('button', { name: 'Sign out this device' }));

    expect(calls.onSignOut).toHaveBeenCalledWith(LISTENING);
  });

  it('offers no way to sign out the device the admin is using', () => {
    draw([{ ...LISTENING, clientId: 'client-1' }], { canSignOut: true });

    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out this device' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionCards.displayName).toBe('SessionCards');
  });
});
