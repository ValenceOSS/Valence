import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aShell } from '@ValenceClient/testing/aShell';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { setListeningParty } from '@ValenceScreens/music/listeningParty';
import { ListeningPartyPanel } from './ListeningPartyPanel';
import type { WatchParty } from '@ValenceContracts/schemas/WatchParty';

const TRACK = aTrack(1);

const PARTY: WatchParty = {
  id: 'p1',
  kind: 'listen',
  mediaId: TRACK.id,
  createdAtMs: 0,
  everyoneMaySeek: false,
  everyoneMayPlayPause: false,
  hasPassword: false,
  isPlaying: true,
  isHeld: false,
  members: [
    {
      connectionId: 'dan',
      accountId: 'a-dan',
      profileId: null,
      name: 'Dan',
      role: 'host',
      joinedAtMs: 0,
      isWatching: true,
      isReady: true,
      positionSeconds: 0,
      reportedAtMs: 0,
      bufferedAheadSeconds: 0,
    },
  ],
  timekeeperId: 'dan',
};

afterEach(() => {
  setListeningParty(null);
});

describe('ListeningPartyPanel', () => {
  it('starts a party from the song playing', async () => {
    const open = vi.fn();
    const { player } = aFakeMusicPlayer({ current: TRACK, isPlaying: true });

    renderInAShell(<ListeningPartyPanel player={player} />, {
      watchParty: { ...aShell().watchParty, open },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Start a listening party' }));

    expect(open).toHaveBeenCalledWith(TRACK.id, 'listen');
  });

  it('waits for something to be playing before a party can start', () => {
    renderInAShell(<ListeningPartyPanel player={aFakeMusicPlayer().player} />);

    expect(screen.getByRole('button', { name: 'Start a listening party' })).toBeDisabled();
  });

  it('shows who is in the party and the link that brings somebody else in', () => {
    setListeningParty({
      party: PARTY,
      hostName: 'Dan',
      mayChoose: true,
      mayPlayPause: true,
      maySeek: true,
      send: vi.fn(),
    });

    renderInAShell(<ListeningPartyPanel player={aFakeMusicPlayer().player} />, {
      watchParty: { ...aShell().watchParty, party: PARTY, meConnectionId: 'dan' },
    });

    expect(screen.getByText(/Dan/)).toBeInTheDocument();
    expect(screen.getByText(/\/music\?party=p1/)).toBeInTheDocument();
  });

  it('leaves the party', async () => {
    const leave = vi.fn();

    setListeningParty({
      party: PARTY,
      hostName: 'Dan',
      mayChoose: true,
      mayPlayPause: true,
      maySeek: true,
      send: vi.fn(),
    });

    renderInAShell(<ListeningPartyPanel player={aFakeMusicPlayer().player} />, {
      watchParty: { ...aShell().watchParty, party: PARTY, meConnectionId: 'dan', leave },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Leave' }));

    expect(leave).toHaveBeenCalled();
  });

  it('will not start a second party while watching a film with somebody', () => {
    renderInAShell(<ListeningPartyPanel player={aFakeMusicPlayer().player} />, {
      watchParty: { ...aShell().watchParty, party: { ...PARTY, kind: 'watch' } },
    });

    expect(screen.getByText('You are in a watch party')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ListeningPartyPanel.displayName).toBe('ListeningPartyPanel');
  });
});
