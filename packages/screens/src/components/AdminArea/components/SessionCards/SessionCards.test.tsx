import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { SessionCards } from './SessionCards';

const LISTENING: ActiveSession = {
  clientId: 'tab-1',
  accountId: 'account-1',
  profileId: 'profile-1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Kitchen speaker',
  clientKind: 'browser',
  connectedAt: 1000,
  streams: null,
  playback: null,
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
  bookListening: null,
  reading: null,
};

const draw = (sessions: ActiveSession[]) => {
  const calls = {
    onStop: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onMessage: vi.fn(),
  };

  render(<SessionCards sessions={sessions} busyClientId={null} {...calls} />);

  return calls;
};

describe('SessionCards', () => {
  it('says so when nobody has the app open', () => {
    draw([]);

    expect(screen.getByText('No one is using the app right now.')).toBeInTheDocument();
  });

  it('gathers each session under whoever has it open', () => {
    draw([
      LISTENING,
      { ...LISTENING, clientId: 'tab-2', deviceLabel: 'Study laptop' },
      { ...LISTENING, clientId: 'tab-3', profileId: 'profile-2', profileName: 'Ruth' },
    ]);

    expect(screen.getByRole('heading', { name: 'Dan' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ruth' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('hands the session on when one is paused, stopped or told something', async () => {
    const user = userEvent.setup();
    const calls = draw([LISTENING]);

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    await user.click(screen.getByRole('button', { name: 'Message' }));

    expect(calls.onPause).toHaveBeenCalledWith('tab-1');
    expect(calls.onStop).toHaveBeenCalledWith('tab-1');
    expect(calls.onMessage).toHaveBeenCalledWith(LISTENING);
  });

  it('hands the session on when a paused one is let carry on', async () => {
    const user = userEvent.setup();
    const listening = LISTENING.listening;

    if (listening === null) {
      throw new Error('The fixture is listening.');
    }

    const calls = draw([{ ...LISTENING, listening: { ...listening, isPlaying: false } }]);

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(calls.onResume).toHaveBeenCalledWith('tab-1');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionCards.displayName).toBe('SessionCards');
  });
});
