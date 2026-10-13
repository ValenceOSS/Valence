import { sayAgain } from '@ValenceI18n/sayAgain';
import {
  describeAudioAxis,
  describeAxis,
  describeVideoAxis,
} from '@ValenceCore/functions/describePlaybackAxis';
import { describeTranscodeReuse } from '@ValenceCore/functions/describeTranscodeReuse';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

type StreamReading = {
  positionSeconds: number;
  bufferedSeconds: number;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  bitrate: number | null;
  frameRate: number | null;
  range: string | null;
};

type StreamStatsGroup = {
  name: string;
  rows: [string, string][];
};

type StreamStatsInput = {
  title: string;
  mediaId: string;
  detail: MediaDetail | null;
  session: StartedSession | null;
  sessionStartSeconds: number;
  quality: string;
  reading: StreamReading;
};

/**
 * Describes a picture's size, or says nothing is known yet.
 *
 * @param width - How wide.
 * @param height - How tall.
 * @returns The size, or a note that there is none to report.
 */
const sizeOf = (width: number | null, height: number | null): string =>
  width === null || height === null || width === 0
    ? say('tv.player.streamStats.notReported')
    : `${width.toString()}x${height.toString()}`;

/**
 * Everything Valence knows about what is on screen and how it got there, in the groups the web's
 * stats for nerds uses: what the session is, what the file holds, what this device is being sent,
 * what the server decided to do with each part of the file, and how playing is faring. Shared by
 * the television and the phone, which each draw the groups in their own way.
 *
 * @param input - What is playing, the session serving it, and what the player says right now.
 * @returns The groups, in the order they are read.
 */
const describeStreamStats = ({
  title,
  mediaId,
  detail,
  session,
  sessionStartSeconds,
  quality,
  reading,
}: StreamStatsInput): StreamStatsGroup[] => {
  const audio = detail?.audioStreams[0] ?? null;
  const plan = session?.plan ?? null;

  return [
    {
      name: say('common.session'),
      rows: [
        [say('common.title'), title],
        [say('tv.player.streamStats.mediaId'), mediaId],
        [say('common.session'), session?.sessionId ?? say('tv.player.streamStats.notStarted')],
        [say('common.mode'), session?.mode ?? say('common.deciding')],
        [
          say('tv.player.streamStats.reused'),
          session === null ? say('common.deciding') : describeTranscodeReuse(session.reuse),
        ],
        [say('tv.player.streamStats.startsAt'), formatDuration(sessionStartSeconds)],
        [say('tv.player.streamStats.qualityAsked'), quality],
        [
          say('tv.player.streamStats.delivery'),
          session === null
            ? 'none'
            : session.delivery.kind === 'hls'
              ? 'HLS'
              : say('common.direct'),
        ],
      ],
    },
    {
      name: say('common.source'),
      rows: [
        [
          say('common.video'),
          detail === null
            ? 'unknown'
            : `${detail.videoCodec} ${sizeOf(detail.width, detail.height)} ${detail.videoRange}`,
        ],
        [
          say('common.audio'),
          audio === null
            ? 'none'
            : `${audio.codec} ${audio.channels.toString()}ch ${audio.language ?? ''}`.trim(),
        ],
        [
          say('common.subtitles'),
          detail === null || detail.subtitleStreams.length === 0
            ? 'none'
            : sayCount('common.count.tracks', detail.subtitleStreams.length),
        ],
      ],
    },
    {
      name: say('tv.player.streamStats.output'),
      rows: [
        [say('common.size'), sizeOf(reading.width, reading.height)],
        [
          say('tv.player.streamStats.range'),
          reading.range ?? say('tv.player.streamStats.notReported'),
        ],
        [
          say('tv.player.streamStats.container'),
          reading.mimeType ?? say('tv.player.streamStats.notReported'),
        ],
        [
          say('common.bitrate'),
          reading.bitrate === null
            ? say('tv.player.streamStats.notReported')
            : `${Math.round(reading.bitrate / 1000).toString()}kbps`,
        ],
        [
          say('tv.player.streamStats.frameRate'),
          reading.frameRate === null
            ? say('tv.player.streamStats.notReported')
            : `${reading.frameRate.toFixed(3)}fps`,
        ],
      ],
    },
    {
      name: say('tv.player.streamStats.plan'),
      rows: [
        [
          say('tv.player.streamStats.container'),
          plan === null
            ? say('common.deciding')
            : describeAxis(plan.container.kind, sayAgain(plan.container.reason.detail)),
        ],
        [
          say('common.video'),
          plan === null ? say('common.deciding') : describeVideoAxis(plan.video),
        ],
        [
          say('common.audio'),
          plan === null ? say('common.deciding') : describeAudioAxis(plan.audio),
        ],
        [
          say('common.subtitles'),
          plan === null
            ? say('common.deciding')
            : describeAxis(plan.subtitles.kind, sayAgain(plan.subtitles.reason.detail)),
        ],
      ],
    },
    {
      name: say('tv.player.streamStats.playback'),
      rows: [
        [say('common.position'), formatDuration(reading.positionSeconds)],
        [
          say('tv.player.streamStats.bufferedAhead'),
          `${Math.max(0, reading.bufferedSeconds - reading.positionSeconds).toFixed(1)}s`,
        ],
      ],
    },
    ...(session === null || session.warnings.length === 0
      ? []
      : [
          {
            name: say('common.warnings'),
            rows: [
              [
                say('tv.player.streamStats.fromTheServer'),
                session.warnings.map(sayAgain).join(' · '),
              ],
            ] satisfies [string, string][],
          },
        ]),
  ];
};

export type { StreamReading, StreamStatsGroup, StreamStatsInput };

export { describeStreamStats };
