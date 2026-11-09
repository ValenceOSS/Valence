import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
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

type Playing = NonNullable<ActiveSession['playback']>;

/**
 * A tab transcoding a film whose player has not yet said how it is getting on, changed by whatever
 * the test needs.
 *
 * @param playing - What differs in what it is playing.
 * @param changes - What differs in the session itself.
 * @returns The session.
 */
const watching = (playing: Partial<Playing> = {}, changes: Partial<ActiveSession> = {}) =>
  anActiveSession({
    deviceLabel: 'Chrome on macOS',
    playback: aSessionPlayback({
      mode: 'transcode',
      plan: PLAN,
      reuse: 'none',
      health: null,
      ...playing,
    }),
    ...changes,
  });

const IDLE_SESSION = anActiveSession({ deviceLabel: 'Chrome on macOS' });

const HEALTH = {
  positionSeconds: 600,
  durationSeconds: 7200,
  bufferedAheadSeconds: 12.4,
  presentedWidth: 1920,
  presentedHeight: 1080,
};

const shown = (session: ActiveSession) =>
  render(<SessionStatsDialog session={session} isOpen onClose={vi.fn()} />);

const card = (name: string) => screen.getByRole('region', { name });

const glance = () => screen.getByLabelText('At a glance');

/**
 * What a list of facts gives for one of its names.
 *
 * @param list - The card or strip the fact is in.
 * @param name - What the fact is.
 * @returns The value beside that name.
 */
const factIn = (list: HTMLElement, name: string) =>
  within(list).getByText(name, { selector: 'dt' }).nextElementSibling;

describe('SessionStatsDialog', () => {
  it('heads itself with what is playing, and shows at a glance how and that it plays', () => {
    shown(watching());

    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(factIn(glance(), 'Mode')).toHaveTextContent('Transcoding');
    expect(factIn(glance(), 'Status')).toHaveTextContent('Playing');
    expect(factIn(glance(), 'Started')).toHaveTextContent(new Date(1500).toLocaleTimeString());
  });

  it('heads itself with the show and then the episode, where it is one', () => {
    shown(
      watching({
        seriesTitle: 'The Show',
        seasonNumber: 1,
        episodeNumber: 3,
        mediaTitle: 'The Third One',
      }),
    );

    expect(screen.getByText('The Show · S01E03 - The Third One')).toBeInTheDocument();
  });

  it('names the viewer and their device', () => {
    shown(watching());

    expect(factIn(card('Viewer'), 'Viewer')).toHaveTextContent('Dan');
    expect(factIn(card('Viewer'), 'Device')).toHaveTextContent('Chrome on macOS');
  });

  it('names the device and what it reaches Valence through on rows of their own', () => {
    shown(
      watching(
        {},
        {
          device: sayVerbatim('Dan’s MacBook Pro'),
          client: sayVerbatim('Chrome on macOS'),
        },
      ),
    );

    expect(factIn(card('Viewer'), 'Device')).toHaveTextContent('Dan’s MacBook Pro');
    expect(factIn(card('Viewer'), 'Browser or app')).toHaveTextContent('Chrome on macOS');
  });

  it('shows a dash for what a device reaches Valence through where the server does not say', () => {
    shown(watching());

    expect(factIn(card('Viewer'), 'Browser or app')).toHaveTextContent(/^—$/u);
  });

  it('gives the user agent the device sent in full, where it sent one', () => {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0 Safari/537.36';

    shown(watching({}, { userAgent }));

    expect(factIn(card('Viewer'), 'User agent')).toHaveTextContent(userAgent);
    expect(factIn(card('Viewer'), 'User agent')).toHaveAttribute('title', userAgent);
  });

  it('says how the stream is delivered', () => {
    shown(watching());

    expect(factIn(card('Session'), 'Delivery')).toHaveTextContent(
      'Transcoding — the server is transcoding the video in real time',
    );
  });

  it('names the graphics device a stream is encoded on', () => {
    shown(
      watching({
        hardware: { deviceId: 'pci:0', deviceName: 'Apple M4 Max', accel: 'videotoolbox' },
      }),
    );

    expect(factIn(card('Session'), 'Graphics device')).toHaveTextContent('M4 Max · VideoToolbox');
  });

  it('shows a dash for the graphics device where the stream was not placed on one', () => {
    shown(watching());

    expect(factIn(card('Session'), 'Graphics device')).toHaveTextContent(/^—$/u);
  });

  it('says when a stream was paused by an admin, not just that it is paused', () => {
    shown(watching({ isPlaying: false, pausedByAdmin: true }));

    expect(factIn(glance(), 'Status')).toHaveTextContent('Paused by an admin');
  });

  it('says a stream the viewer paused is paused', () => {
    shown(watching({ isPlaying: false }));

    expect(factIn(glance(), 'Status')).toHaveTextContent(/^Paused$/u);
  });

  it('says a transcode is being made now where nothing was reused', () => {
    shown(watching());

    expect(factIn(card('Session'), 'Reused')).toHaveTextContent(
      'No — this transcode is running now',
    );
  });

  it('says when a session is playing a transcode that was already made', () => {
    shown(watching({ reuse: 'whole' }));

    expect(factIn(card('Session'), 'Reused')).toHaveTextContent(
      'Yes — the whole transcode was already done',
    );
  });

  it('says when nothing is playing rather than showing empty figures', () => {
    shown(IDLE_SESSION);

    expect(screen.getByText('Nothing right now')).toBeInTheDocument();
    expect(screen.queryByLabelText('At a glance')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Playback' })).not.toBeInTheDocument();
  });

  it('explains what is being converted and why, axis by axis', () => {
    shown(watching());

    const plan = card('Plan');

    expect(factIn(plan, 'Container')).toHaveTextContent('remux');
    expect(within(plan).getByText('Client does not support mkv')).toBeInTheDocument();
    expect(factIn(plan, 'Video')).toHaveTextContent('transcode');
    expect(within(plan).getByText('Client does not support hevc')).toBeInTheDocument();
    expect(factIn(plan, 'Audio')).toHaveTextContent('passthrough');
    expect(factIn(plan, 'Subtitles')).toHaveTextContent('none');
    expect(within(plan).getAllByText('Client declares support')).toHaveLength(2);
  });

  it('gives the ceiling a transcode is encoded to, and none for what is passed through', () => {
    shown(watching());

    expect(factIn(card('Plan'), 'Video')).toHaveTextContent('1920×1080 · 8000 kbps');
    expect(factIn(card('Plan'), 'Audio')).toHaveTextContent(/^passthrough$/u);
  });

  it('gives the bitrate sound is encoded to where it is converted too', () => {
    shown(
      watching({
        plan: {
          ...PLAN,
          audio: {
            kind: 'transcode',
            streamIndex: 1,
            codec: 'aac',
            channels: 2,
            maxBitrateKbps: 192,
            reason,
          },
        },
      }),
    );

    expect(factIn(card('Plan'), 'Audio')).toHaveTextContent('192 kbps');
  });

  it('says the player has not reported yet before the first heartbeat carries how it is doing', () => {
    shown(watching());

    expect(factIn(card('Playback'), 'Position')).toHaveTextContent('Not reported yet');
    expect(factIn(glance(), 'Position')).toHaveTextContent(/^—$/u);
    expect(factIn(glance(), 'Buffered ahead')).toHaveTextContent(/^—$/u);
  });

  it('shows where the player is, its buffer and the picture size it last reported', () => {
    shown(watching({ health: HEALTH }));

    expect(factIn(glance(), 'Picture')).toHaveTextContent('1920×1080');
    expect(factIn(glance(), 'Position')).toHaveTextContent('10:00');
    expect(factIn(glance(), 'Buffered ahead')).toHaveTextContent('12.4s');
    expect(factIn(card('Playback'), 'Position')).toHaveTextContent('10:00 / 2:00:00');
    expect(factIn(card('Playback'), 'Buffered ahead')).toHaveTextContent('12.4s');
    expect(factIn(card('Playback'), 'Drawn at')).toHaveTextContent('1920×1080');
  });

  it('says nothing has been decoded yet where the player has drawn no picture', () => {
    shown(watching({ health: { ...HEALTH, presentedWidth: 0, presentedHeight: 0 } }));

    expect(factIn(card('Playback'), 'Drawn at')).toHaveTextContent('Nothing decoded yet');
    expect(factIn(glance(), 'Picture')).toHaveTextContent(/^—$/u);
  });

  it('names the media and the tab, for looking them up', () => {
    shown(watching());

    expect(factIn(card('Playback'), 'Media')).toHaveTextContent('media-1');
    expect(factIn(card('Playback'), 'Client')).toHaveTextContent('tab-1');
  });

  it('can be closed', async () => {
    const onClose = vi.fn();
    const actor = userEvent.setup();

    render(<SessionStatsDialog session={watching()} isOpen onClose={onClose} />);
    await actor.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
