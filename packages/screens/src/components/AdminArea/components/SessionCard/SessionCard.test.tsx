import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { DeviceIdentitySchema } from '@ValenceContracts/schemas/DeviceIdentity';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { SessionCard } from './SessionCard';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

const LISTENING: ActiveSession['listening'] = {
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
};

const READING: ActiveSession['reading'] = {
  bookId: '00000000-0000-4000-8000-0000000000b1',
  title: 'Dune',
  authors: ['Frank Herbert'],
  hasCover: false,
  fraction: 0.42,
  pageNumber: null,
  reportedAtMs: 1,
};

const draw = (session: ActiveSession, options: { isBusy?: boolean; canSignOut?: boolean } = {}) => {
  const calls = {
    onStop: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onMessage: vi.fn(),
    onSignOut: vi.fn(),
  };
  const { onSignOut, ...always } = calls;

  render(
    <SessionCard
      session={session}
      isBusy={options.isBusy ?? false}
      {...always}
      {...(options.canSignOut === true ? { onSignOut } : {})}
    />,
  );

  return calls;
};

const watching = (changes: Partial<NonNullable<ActiveSession['playback']>> = {}) =>
  anActiveSession({ playback: aSessionPlayback(changes) });

describe('SessionCard', () => {
  it('shows a film by its title logo, whether it is playing, how it is delivered and how far through it is', () => {
    draw(watching());

    expect(screen.getByRole('img', { name: 'Arrival' })).toBeInTheDocument();
    expect(screen.getByText('Playing')).toBeInTheDocument();
    expect(screen.getByText('Direct play')).toBeInTheDocument();
    expect(screen.getByText('1:13:02 - 2:10:26')).toBeInTheDocument();
    expect(screen.getByText('Living room TV')).toBeInTheDocument();
  });

  it('names an episode by its show, then its season, number and name', () => {
    draw(
      watching({
        mediaTitle: 'The Long Corridor',
        seriesTitle: 'Night Shift',
        seasonNumber: 2,
        episodeNumber: 5,
      }),
    );

    expect(screen.getByRole('img', { name: 'Night Shift' })).toBeInTheDocument();
    expect(screen.getByText('S02E05 - The Long Corridor')).toBeInTheDocument();
  });

  it('says a remux is a remux, rather than badging it as a transcode', () => {
    const playback = aSessionPlayback();

    draw(
      watching({
        plan: {
          ...playback.plan,
          container: { kind: 'remux', target: 'mp4', reason: playback.plan.container.reason },
        },
      }),
    );

    expect(screen.getByText('Remux')).toBeInTheDocument();
    expect(screen.queryByText('Transcoding')).not.toBeInTheDocument();
  });

  it('says a stream is paused, and offers to let it carry on', async () => {
    const calls = draw(watching({ isPlaying: false, pausedByAdmin: true }));

    expect(screen.getByText('Paused')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(calls.onResume).toHaveBeenCalled();
  });

  it('offers a working play button when a viewer paused it themselves', async () => {
    const calls = draw(watching({ isPlaying: false, pausedByAdmin: false }));

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(calls.onResume).toHaveBeenCalled();
  });

  it('pauses a stream that is playing', async () => {
    const calls = draw(watching());

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(calls.onPause).toHaveBeenCalled();
  });

  it('stops a stream on request', async () => {
    const calls = draw(watching());

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(calls.onStop).toHaveBeenCalled();
  });

  it('asks to message without stopping or pausing anything', async () => {
    const calls = draw(watching());

    await userEvent.click(screen.getByRole('button', { name: 'Message' }));

    expect(calls.onMessage).toHaveBeenCalled();
    expect(calls.onStop).not.toHaveBeenCalled();
    expect(calls.onPause).not.toHaveBeenCalled();
  });

  it('opens the stats for a stream, and closes them again', async () => {
    const actor = userEvent.setup();

    draw(watching());

    await actor.click(screen.getByRole('button', { name: 'Stream stats' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: /^Close$/ }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('holds back every instruction while one is already on its way, but still shows the stats', () => {
    draw(watching(), { isBusy: true, canSignOut: true });

    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sign out this device' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stream stats' })).toBeEnabled();
  });

  it('keeps every control for a tab with nothing playing, each saying why it cannot be used', () => {
    draw(anActiveSession());

    expect(screen.getByText('Nothing playing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nothing is playing to pause.' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nothing is playing to stop.' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Stream stats show only for videos.' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Messages show only while they’re watching a video.' }),
    ).toBeDisabled();
  });

  it('says the TV app cannot show a message, even while it plays a film', () => {
    draw(anActiveSession({ clientKind: 'tv', playback: aSessionPlayback() }));

    expect(screen.getByRole('button', { name: 'The TV app can’t show messages.' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Message' })).not.toBeInTheDocument();
  });

  it('signs a device out on request', async () => {
    const calls = draw(watching(), { canSignOut: true });

    await userEvent.click(screen.getByRole('button', { name: 'Sign out this device' }));

    expect(calls.onSignOut).toHaveBeenCalled();
  });

  it('offers no sign-out where it is not allowed, or where nobody is signed in', () => {
    draw(watching());
    draw(anActiveSession({ clientId: 'tab-2', accountId: null }), { canSignOut: true });

    expect(screen.queryByRole('button', { name: 'Sign out this device' })).not.toBeInTheDocument();
  });

  it('marks the device the admin is using rather than offering to act on it', () => {
    draw(anActiveSession({ clientId: 'client-1', playback: aSessionPlayback() }), {
      canSignOut: true,
    });

    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  describe('somebody listening to music', () => {
    it('names the song, who it is by, how it is reaching the device, and where it is', () => {
      draw(anActiveSession({ listening: LISTENING }));

      expect(screen.getByText('Caramel')).toBeInTheDocument();
      expect(screen.getByText('Sleep Token')).toBeInTheDocument();
      expect(screen.getByText('Transcoding')).toBeInTheDocument();
      expect(screen.getByText('1:05 - 4:50')).toBeInTheDocument();
    });

    it('says the file is going as it is where nothing is encoded', () => {
      draw(
        anActiveSession({
          listening:
            LISTENING === null
              ? null
              : { ...LISTENING, delivery: 'direct', codec: 'flac', kbps: 1492 },
        }),
      );

      expect(screen.getByText('Direct play')).toBeInTheDocument();
    });

    it('offers pausing and stopping as for a film, but no stats and no message', async () => {
      const calls = draw(anActiveSession({ listening: LISTENING }));

      await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

      expect(calls.onPause).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
      expect(
        screen.getByRole('button', { name: 'Stream stats show only for videos.' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Messages show only while they’re watching a video.' }),
      ).toBeDisabled();
    });
  });

  it('shows an audiobook being listened to, with its authors, and offers to pause it', async () => {
    const calls = draw(
      anActiveSession({
        bookListening: {
          bookId: '00000000-0000-4000-8000-0000000000b1',
          title: 'Dune',
          authors: ['Frank Herbert'],
          hasCover: false,
          isPlaying: true,
          positionSeconds: 600,
          durationSeconds: 3600,
          reportedAtMs: 1,
        },
      }),
    );

    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 1:00:00')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(calls.onPause).toHaveBeenCalled();
  });

  it('shows somebody reading a book and how far through, with nothing to pause or stop', () => {
    draw(anActiveSession({ reading: READING }));

    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nothing is playing to pause.' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nothing is playing to stop.' })).toBeDisabled();
  });

  it('names the device and what it reaches Valence through, where the server says', () => {
    draw(
      anActiveSession({
        deviceLabel: 'Valence (iPhone)',
        device: sayVerbatim('iPhone 17 Pro Max'),
        client: sayVerbatim('Valence for iOS'),
        identity: DeviceIdentitySchema.parse({ app: 'phone', system: 'ios', form: 'phone' }),
        clientKind: 'phone',
      }),
    );

    expect(screen.getByText('iPhone 17 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Valence for iOS')).toBeInTheDocument();
    expect(screen.queryByText('Valence (iPhone)')).not.toBeInTheDocument();
  });

  it('says which device a remote is driving', () => {
    draw(anActiveSession({ remoteFor: { clientId: 'tab-9', label: 'Living room TV' } }));

    expect(screen.getByText('Remote for Living room TV')).toBeInTheDocument();
  });

  it('says which device is driving a session from afar', () => {
    draw(
      anActiveSession({
        playback: aSessionPlayback(),
        controlledFrom: { clientId: 'phone-1', label: 'Dan’s phone' },
      }),
    );

    expect(screen.getByText('Controlled from Dan’s phone')).toBeInTheDocument();
  });

  it('says what its account is limited to while it streams', () => {
    draw(anActiveSession({ streams: { limit: { maxBitrateKbps: 8000, maxStreams: 3 }, now: 2 } }));

    expect(screen.getByText('2 of 3 streams · Up to 8 Mbps')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionCard.displayName).toBe('SessionCard');
  });
});
