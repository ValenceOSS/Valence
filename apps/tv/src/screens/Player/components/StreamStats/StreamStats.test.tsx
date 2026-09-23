import { render } from '@testing-library/react-native';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { StreamStats } from '@ValenceTv/screens/Player/components/StreamStats/StreamStats';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { StreamReading } from '@ValenceTv/screens/Player/components/StreamStats/StreamStats.types';

const DETAIL = MediaDetailSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 6960,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  width: 3840,
  height: 2160,
  bitrateKbps: 40_000,
  addedAt: '2026-01-01T00:00:00.000Z',
  metadata: { hasPoster: true, hasBackdrop: true, hasLogo: false },
  audioStreams: [{ index: 1, codec: 'eac3', channels: 6, language: 'eng', isAtmos: true }],
  subtitleStreams: [
    { index: 2, format: 'srt', language: 'eng', isForced: false },
    { index: 3, format: 'srt', language: 'fra', isForced: false },
  ],
});

const SESSION: StartedSession = {
  sessionId: 'session-7',
  delivery: { kind: 'hls', manifestUrl: '/api/sessions/session-7/main.m3u8' },
  mode: 'transcode',
  plan: {
    mediaId: '00000000-0000-4000-8000-000000000001',
    container: {
      kind: 'remux',
      target: 'mp4',
      reason: { code: 'ContainerNotSupported', detail: 'mkv is not played here' },
    },
    video: {
      kind: 'transcode',
      codec: 'h264',
      range: 'SDR',
      maxBitrateKbps: 8000,
      maxWidth: 1920,
      maxHeight: 1080,
      reason: { code: 'VideoResolutionAboveLimit', detail: 'too large' },
    },
    audio: {
      kind: 'passthrough',
      streamIndex: 1,
      reason: { code: 'ClientSupportsSource', detail: 'eac3 plays as it is' },
    },
    subtitles: { kind: 'none', reason: { code: 'ClientSupportsSource', detail: 'none chosen' } },
  },
  warnings: ['Tone mapped', 'Slow disk'],
  reuse: 'whole',
};

const READING: StreamReading = {
  positionSeconds: 90,
  bufferedSeconds: 102.34,
  width: 1920,
  height: 1080,
  mimeType: 'application/x-mpegURL',
  bitrate: 7_654_321,
  frameRate: 23.976,
  range: 'SDR',
};

const NOTHING_READ: StreamReading = {
  positionSeconds: 0,
  bufferedSeconds: 0,
  width: null,
  height: null,
  mimeType: null,
  bitrate: null,
  frameRate: null,
  range: null,
};

const valuesOf = (drawn: Awaited<ReturnType<typeof render>>, name: string) =>
  drawn.getAllByText(name).map((label) => {
    const [, value] = label.parent?.queryAll((node) => node.type === 'Text') ?? [];

    return (
      value?.children.filter((child): child is string => typeof child === 'string').join('') ?? null
    );
  });

describe('StreamStats', () => {
  it('lays out the session, source, output, plan and playback under their headings', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={DETAIL}
        session={SESSION}
        sessionStartSeconds={75}
        quality="1080p"
        reading={READING}
      />,
    );

    expect(drawn.getByText('Stats for nerds')).toBeTruthy();

    for (const heading of ['Session', 'Source', 'Output', 'Plan', 'Playback', 'Warnings']) {
      expect(drawn.getAllByText(heading).length).toBeGreaterThan(0);
    }
  });

  it('says what the session is and how it is being sent', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={DETAIL}
        session={SESSION}
        sessionStartSeconds={75}
        quality="1080p"
        reading={READING}
      />,
    );

    expect(valuesOf(drawn, 'Title')).toEqual(['Arrival']);
    expect(valuesOf(drawn, 'Media id')).toEqual(['media-1']);
    expect(drawn.getByText('session-7')).toBeTruthy();
    expect(valuesOf(drawn, 'Mode')).toEqual(['transcode']);
    expect(valuesOf(drawn, 'Reused')).toEqual(['Yes — the whole transcode was already made']);
    expect(valuesOf(drawn, 'Starts at')).toEqual(['1:15']);
    expect(valuesOf(drawn, 'Quality asked')).toEqual(['1080p']);
    expect(valuesOf(drawn, 'Delivery')).toEqual(['HLS']);
  });

  it('says what the file holds', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={DETAIL}
        session={SESSION}
        sessionStartSeconds={0}
        quality="Original"
        reading={READING}
      />,
    );

    expect(valuesOf(drawn, 'Video')).toContain('hevc 3840x2160 HDR10');
    expect(valuesOf(drawn, 'Audio')).toContain('eac3 6ch eng');
    expect(valuesOf(drawn, 'Subtitles')).toContain('2 tracks');
  });

  it('says what the television is being sent, as the player reports it', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={DETAIL}
        session={SESSION}
        sessionStartSeconds={0}
        quality="Original"
        reading={READING}
      />,
    );

    expect(valuesOf(drawn, 'Size')).toEqual(['1920x1080']);
    expect(valuesOf(drawn, 'Range')).toEqual(['SDR']);
    expect(valuesOf(drawn, 'Container')).toContain('application/x-mpegURL');
    expect(valuesOf(drawn, 'Bitrate')).toEqual(['7654kbps']);
    expect(valuesOf(drawn, 'Frame rate')).toEqual(['23.976fps']);
    expect(valuesOf(drawn, 'Position')).toEqual(['1:30']);
    expect(valuesOf(drawn, 'Buffered ahead')).toEqual(['12.3s']);
  });

  it('says what the server decided for each part of the file', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={DETAIL}
        session={SESSION}
        sessionStartSeconds={0}
        quality="Original"
        reading={READING}
      />,
    );

    expect(valuesOf(drawn, 'Container')).toContain('remux — mkv is not played here');
    expect(valuesOf(drawn, 'Video')).toContain('transcode — too large (1920x1080 @ 8000kbps)');
    expect(valuesOf(drawn, 'Audio')).toContain('passthrough — eac3 plays as it is');
    expect(valuesOf(drawn, 'Subtitles')).toContain('none — none chosen');
    expect(valuesOf(drawn, 'From the server')).toEqual(['Tone mapped · Slow disk']);
  });

  it('says what is not known yet before a session has started or the player has reported', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={null}
        session={null}
        sessionStartSeconds={0}
        quality="Original"
        reading={NOTHING_READ}
      />,
    );

    expect(valuesOf(drawn, 'Session')).toContain('not started');
    expect(valuesOf(drawn, 'Mode')).toEqual(['deciding']);
    expect(valuesOf(drawn, 'Reused')).toEqual(['deciding']);
    expect(valuesOf(drawn, 'Delivery')).toEqual(['none']);
    expect(valuesOf(drawn, 'Video')).toEqual(['unknown', 'deciding']);
    expect(valuesOf(drawn, 'Audio')).toEqual(['none', 'deciding']);
    expect(valuesOf(drawn, 'Subtitles')).toEqual(['none', 'deciding']);
    expect(valuesOf(drawn, 'Size')).toEqual(['not reported']);
    expect(valuesOf(drawn, 'Range')).toEqual(['not reported']);
    expect(valuesOf(drawn, 'Container')).toEqual(['not reported', 'deciding']);
    expect(valuesOf(drawn, 'Bitrate')).toEqual(['not reported']);
    expect(valuesOf(drawn, 'Frame rate')).toEqual(['not reported']);
    expect(valuesOf(drawn, 'Buffered ahead')).toEqual(['0.0s']);
    expect(drawn.queryByText('Warnings')).toBeNull();
  });

  it('calls a session sent whole direct, and a picture with no width not reported', async () => {
    const drawn = await render(
      <StreamStats
        title="Arrival"
        mediaId="media-1"
        detail={{ ...DETAIL, audioStreams: [], subtitleStreams: [] }}
        session={{
          ...SESSION,
          delivery: { kind: 'direct', url: '/api/file' },
          warnings: [],
          reuse: null,
        }}
        sessionStartSeconds={0}
        quality="Original"
        reading={{ ...READING, width: 0 }}
      />,
    );

    expect(valuesOf(drawn, 'Delivery')).toEqual(['Direct']);
    expect(valuesOf(drawn, 'Reused')).toEqual(['n/a — nothing is being transcoded']);
    expect(valuesOf(drawn, 'Size')).toEqual(['not reported']);
    expect(valuesOf(drawn, 'Audio')).toContain('none');
    expect(valuesOf(drawn, 'Subtitles')).toContain('none');
    expect(drawn.queryByText('Warnings')).toBeNull();
  });
});
