import type { StreamStatsInput } from '@ValenceClient/playback/describeStreamStats';
import { say } from '@ValenceI18n/say';

type StreamSummaryItem = {
  label: string;
  value: string | null;
};

/**
 * The few figures the web's stream statistics lead with, to be read at a glance across the room:
 * how the stream is played, the picture's size, the video and sound being sent, the bitrate, and how
 * far ahead the buffer runs.
 *
 * @param input - What is playing, the session serving it, and what the player says right now.
 * @returns The figures in the order they are read, each with nothing where it is not known yet.
 */
const summariseStream = ({ detail, session, reading }: StreamStatsInput): StreamSummaryItem[] => {
  const plan = session?.plan ?? null;
  const sound =
    detail?.audioStreams.find((stream) => stream.index === plan?.audio.streamIndex) ??
    detail?.audioStreams[0] ??
    null;

  return [
    { label: say('common.mode'), value: session?.mode ?? null },
    {
      label: say('common.picture'),
      value:
        reading.width === null || reading.height === null || reading.width === 0
          ? null
          : `${reading.width.toString()}x${reading.height.toString()}`,
    },
    {
      label: say('common.video'),
      value: plan?.video.kind === 'transcode' ? plan.video.codec : (detail?.videoCodec ?? null),
    },
    {
      label: say('common.audio'),
      value:
        plan?.audio.kind === 'transcode'
          ? `${plan.audio.codec} ${plan.audio.channels.toString()}ch`
          : sound === null
            ? null
            : `${sound.codec} ${sound.channels.toString()}ch`,
    },
    {
      label: say('common.bitrate'),
      value:
        reading.bitrate === null
          ? null
          : say('client.playback.describeRungCost.valueMbps', {
              value: (reading.bitrate / 1_000_000).toFixed(1),
            }),
    },
    {
      label: say('tv.player.streamStats.bufferedAhead'),
      value: say('screens.videoPlayer.streamStats.valueSeconds', {
        value: Math.max(0, reading.bufferedSeconds - reading.positionSeconds).toFixed(1),
      }),
    },
  ];
};

export type { StreamSummaryItem };

export { summariseStream };
