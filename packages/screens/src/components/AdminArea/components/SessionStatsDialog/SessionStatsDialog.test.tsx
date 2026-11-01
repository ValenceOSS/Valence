import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionStatsDialog } from './SessionStatsDialog';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';

const reason: Reason = {
  code: 'ClientSupportsSource',
  detail: sayVerbatim('Client declares support'),
};

const PLAN: PlaybackPlan = {
  mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  container: {
    kind: 'remux',
    target: 'mp4',
    reason: { code: 'ContainerNotSupported', detail: sayVerbatim('Client does not support mkv') },
  },
  video: {
    kind: 'transcode',
    codec: 'h264',
    range: 'SDR',
    maxBitrateKbps: 8000,
    maxWidth: 1920,
    maxHeight: 1080,
    reason: { code: 'VideoCodecNotSupported', detail: sayVerbatim('Client does not support hevc') },
  },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const WATCHING_SESSION: ActiveSession = {
  clientId: 'tab-1',
  accountId: 'account-1',
  profileId: 'profile-1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Chrome on macOS',
  device: null,
  client: null,
  identity: null,
  userAgent: null,
  clientKind: 'browser' as const,
  connectedAt: 1000,
  streams: null,
  playback: {
    mediaId: 'media-1',
    mediaTitle: 'Arrival',
    seriesTitle: null,
    seasonNumber: null,
    episodeNumber: null,
    hasPoster: true,
    hasBackdrop: false,
    mode: 'transcode',
    plan: PLAN,
    reuse: 'none',
    hardware: null,
    isPlaying: true,
    pausedByAdmin: false,
    startedAt: 1500,
    health: null,
  },
  listening: null,
  bookListening: null,
  reading: null,
};

const IDLE_SESSION: ActiveSession = { ...WATCHING_SESSION, playback: null };

describe('SessionStatsDialog', () => {
  it('shows what is playing and how', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText(/Transcoding/)).toBeInTheDocument();
    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('names the device and viewer', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('Dan')).toBeInTheDocument();
  });

  it('names the device and what it reaches Valence through on rows of their own', () => {
    render(
      <SessionStatsDialog
        session={{
          ...WATCHING_SESSION,
          device: sayVerbatim('Dan’s MacBook Pro'),
          client: sayVerbatim('Chrome on macOS'),
        }}
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Device')).toBeInTheDocument();
    expect(screen.getByText('Dan’s MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Browser or app')).toBeInTheDocument();
    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
  });

  it('leaves out what a device reaches Valence through where the server does not say', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.queryByText('Browser or app')).not.toBeInTheDocument();
  });

  it('names the graphics device a stream is encoded on', () => {
    const session: ActiveSession = {
      ...WATCHING_SESSION,
      playback:
        WATCHING_SESSION.playback === null
          ? null
          : {
              ...WATCHING_SESSION.playback,
              hardware: { deviceId: 'pci:0', deviceName: 'Apple M4 Max', accel: 'videotoolbox' },
            },
    };

    render(<SessionStatsDialog session={session} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Graphics device')).toBeInTheDocument();
    expect(screen.getByText('M4 Max · VideoToolbox')).toBeInTheDocument();
  });

  it('says nothing of a graphics device where the stream was not placed on one', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.queryByText('Graphics device')).not.toBeInTheDocument();
  });

  it('says when a stream was paused by an admin, not just that it is paused', () => {
    const session: ActiveSession = {
      ...WATCHING_SESSION,
      playback:
        WATCHING_SESSION.playback === null
          ? null
          : { ...WATCHING_SESSION.playback, isPlaying: false, pausedByAdmin: true },
    };

    render(<SessionStatsDialog session={session} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Paused by an admin')).toBeInTheDocument();
  });

  it('says a transcode is being made now where nothing was reused', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('No — this transcode is running now')).toBeInTheDocument();
  });

  it('says when a session is playing a transcode that was already made', () => {
    const session: ActiveSession = {
      ...WATCHING_SESSION,
      playback:
        WATCHING_SESSION.playback === null
          ? null
          : { ...WATCHING_SESSION.playback, reuse: 'whole' },
    };

    render(<SessionStatsDialog session={session} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Yes — the whole transcode was already done')).toBeInTheDocument();
  });

  it('says when nothing is playing rather than showing empty fields', () => {
    render(<SessionStatsDialog session={IDLE_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Nothing right now')).toBeInTheDocument();
  });

  it('explains what is being converted and why, axis by axis', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/remux — Client does not support mkv/)).toBeInTheDocument();
    expect(
      screen.getByText(/transcode — Client does not support hevc \(1920x1080 @ 8000kbps\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/passthrough — Client declares support/)).toBeInTheDocument();
  });

  it('says buffer has not been reported yet before the first heartbeat carries one', () => {
    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Not reported yet')).toBeInTheDocument();
  });

  it('shows the buffer and picture size the player last reported', () => {
    const session: ActiveSession = {
      ...WATCHING_SESSION,
      playback:
        WATCHING_SESSION.playback === null
          ? null
          : {
              ...WATCHING_SESSION.playback,
              health: {
                positionSeconds: 600,
                durationSeconds: 7200,
                bufferedAheadSeconds: 12.4,
                presentedWidth: 1920,
                presentedHeight: 1080,
              },
            },
    };

    render(<SessionStatsDialog session={session} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('12.4s ahead')).toBeInTheDocument();
    expect(screen.getByText('1920x1080')).toBeInTheDocument();
  });

  it('can be closed', async () => {
    const onClose = vi.fn();
    const actor = userEvent.setup();

    render(<SessionStatsDialog session={WATCHING_SESSION} isOpen onClose={onClose} />);
    await actor.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
