import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { summariseStream } from '@ValenceTv/screens/Player/components/StreamStats/summariseStream';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { StreamReading } from '@ValenceClient/playback/describeStreamStats';

const DETAIL = MediaDetailSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Arrival',
  container: 'mkv',
  durationSeconds: 6960,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  width: 3840,
  height: 2160,
  bitrateKbps: 40_000,
  addedAt: '2026-01-01T00:00:00.000Z',
  metadata: { hasPoster: true, hasBackdrop: true, hasLogo: false },
  audioStreams: [
    { index: 1, codec: 'eac3', channels: 6, language: 'eng', isAtmos: false },
    { index: 2, codec: 'aac', channels: 2, language: 'fra', isAtmos: false },
  ],
  subtitleStreams: [],
});

const REASON = { code: 'ClientSupportsSource' as const, detail: sayVerbatim('fine') };

const DIRECT: StartedSession = {
  sessionId: 'session-1',
  delivery: { kind: 'direct', url: '/api/file' },
  mode: 'direct',
  plan: {
    mediaId: DETAIL.id,
    container: { kind: 'passthrough', reason: REASON },
    video: { kind: 'passthrough', reason: REASON },
    audio: { kind: 'passthrough', streamIndex: 2, reason: REASON },
    subtitles: { kind: 'none', reason: REASON },
  },
  warnings: [],
  reuse: null,
  keptCopies: [],
};

const READING: StreamReading = {
  positionSeconds: 100,
  bufferedSeconds: 130.04,
  width: 3840,
  height: 2160,
  mimeType: null,
  bitrate: 41_250_000,
  frameRate: null,
  range: null,
};

const INPUT = {
  title: 'Arrival',
  mediaId: DETAIL.id,
  detail: DETAIL,
  session: DIRECT,
  sessionStartSeconds: 0,
  quality: 'Original',
  reading: READING,
};

describe('summariseStream', () => {
  it('leads with the mode, the picture, the video and sound sent, the bitrate and the buffer', () => {
    expect(summariseStream(INPUT)).toEqual([
      { label: 'Mode', value: 'direct' },
      { label: 'Picture', value: '3840x2160' },
      { label: 'Video', value: 'hevc' },
      { label: 'Audio', value: 'aac 2ch' },
      { label: 'Bitrate', value: '41.3 Mbps' },
      { label: 'Buffered ahead', value: '30.0s' },
    ]);
  });

  it('gives what the server turns the file into where it is transcoding', () => {
    const summary = summariseStream({
      ...INPUT,
      session: {
        ...DIRECT,
        plan: {
          ...DIRECT.plan,
          video: {
            kind: 'transcode',
            codec: 'h264',
            range: 'SDR',
            maxBitrateKbps: 8000,
            maxWidth: 1920,
            maxHeight: 1080,
            reason: REASON,
          },
          audio: {
            kind: 'transcode',
            streamIndex: 1,
            codec: 'aac',
            channels: 2,
            maxBitrateKbps: 256,
            reason: REASON,
          },
        },
      },
    });

    expect(summary[2]).toEqual({ label: 'Video', value: 'h264' });
    expect(summary[3]).toEqual({ label: 'Audio', value: 'aac 2ch' });
  });

  it('leaves what is not known yet empty', () => {
    expect(
      summariseStream({
        ...INPUT,
        detail: null,
        session: null,
        reading: { ...READING, width: null, height: null, bitrate: null, bufferedSeconds: 0 },
      }).map((item) => item.value),
    ).toEqual([null, null, null, null, null, '0.0s']);
  });
});
