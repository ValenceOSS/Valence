import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { SessionTable } from './SessionTable';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

const IDLE_SESSION: ActiveSession = {
  clientId: 'tab-1',
  accountId: 'account-1',
  profileId: 'profile-1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Living room TV',
  device: null,
  client: null,
  identity: null,
  userAgent: null,
  clientKind: 'browser' as const,
  connectedAt: 1000,
  streams: null,
  playback: null,
  listening: null,
  bookListening: null,
  reading: null,
  controlledFrom: null,
  remoteFor: null,
};

const READING: ActiveSession = {
  ...IDLE_SESSION,
  clientId: 'tab-2',
  reading: {
    bookId: '00000000-0000-4000-8000-0000000000b1',
    title: 'Dune',
    authors: ['Frank Herbert'],
    hasCover: false,
    fraction: 0.42,
    pageNumber: null,
    reportedAtMs: 1,
  },
};

const AUDIOBOOK: ActiveSession = {
  ...IDLE_SESSION,
  clientId: 'tab-3',
  bookListening: {
    bookId: '00000000-0000-4000-8000-0000000000b2',
    title: 'An Audiobook',
    authors: ['An Author'],
    hasCover: false,
    isPlaying: true,
    positionSeconds: 60,
    durationSeconds: 3600,
    reportedAtMs: 1,
  },
};

const PAUSED_MUSIC: ActiveSession = {
  ...IDLE_SESSION,
  clientId: 'tab-4',
  listening: {
    trackId: '00000000-0000-4000-8000-000000000001',
    title: 'A Song',
    artists: ['An Artist'],
    albumId: '00000000-0000-4000-8000-000000000002',
    hasArtwork: false,
    isPlaying: false,
    positionSeconds: 65,
    durationSeconds: 290,
    reportedAtMs: 1,
    quality: 'low',
    delivery: 'encoded',
    codec: 'aac',
    kbps: 96,
  },
};

const handlers = () => ({
  onStop: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onMessage: vi.fn(),
});

describe('SessionTable', () => {
  it('says nothing is playing on a session that is only open', () => {
    renderWithAnswers(
      <SessionTable sessions={[IDLE_SESSION]} busyClientId={null} {...handlers()} />,
    );

    expect(screen.getByText('Nothing playing')).toBeInTheDocument();
  });

  it('offers no stop for somebody reading', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<SessionTable sessions={[READING]} busyClientId={null} {...handlers()} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await screen.findByRole('menu');

    expect(screen.queryByRole('menuitem', { name: 'Stop' })).not.toBeInTheDocument();
  });

  it('offers to pause and stop somebody listening to an audiobook', async () => {
    const user = userEvent.setup();
    const on = handlers();

    renderWithAnswers(<SessionTable sessions={[AUDIOBOOK]} busyClientId={null} {...on} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Pause' }));

    expect(on.onPause).toHaveBeenCalledWith('tab-3');

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Stop' }));

    expect(on.onStop).toHaveBeenCalledWith('tab-3');
  });

  it('offers to play music somebody has paused', async () => {
    const user = userEvent.setup();
    const on = handlers();

    renderWithAnswers(<SessionTable sessions={[PAUSED_MUSIC]} busyClientId={null} {...on} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Play' }));

    expect(on.onResume).toHaveBeenCalledWith('tab-4');
  });
});
