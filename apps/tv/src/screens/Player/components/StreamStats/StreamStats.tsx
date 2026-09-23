import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  describeAudioAxis,
  describeAxis,
  describeVideoAxis,
} from '@ValenceCore/functions/describePlaybackAxis';
import { describeTranscodeReuse } from '@ValenceCore/functions/describeTranscodeReuse';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { tokens } from '@ValenceTv/theme/tokens';
import type { StreamStatsProps } from './StreamStats.types';

const WIDTH = 760;

/**
 * Describes a picture's size, or says nothing is known yet.
 *
 * @param width - How wide.
 * @param height - How tall.
 * @returns The size, or a note that there is none to report.
 */
const sizeOf = (width: number | null, height: number | null): string =>
  width === null || height === null || width === 0
    ? 'not reported'
    : `${width.toString()}x${height.toString()}`;

/**
 * Everything Valence knows about what is on screen and how it got there, as the web's stats for
 * nerds lays it out: what the session is, what the file holds, what the television is being sent,
 * what the server decided to do with each part of the file, and how playing is faring. It sits in
 * the corner over the picture while playing carries on, reading the player again each second, for
 * whoever is working out why a stream looks or behaves as it does.
 *
 * @param title - What is playing.
 * @param mediaId - Its id.
 * @param detail - What the catalogue holds about it.
 * @param session - The session serving it, once one has started.
 * @param sessionStartSeconds - Where the session began, which is not always where playing is now.
 * @param quality - The quality asked for.
 * @param reading - What the player says about playing right now.
 */
const StreamStats = ({
  title,
  mediaId,
  detail,
  session,
  sessionStartSeconds,
  quality,
  reading,
}: StreamStatsProps) => {
  const audio = detail?.audioStreams[0] ?? null;
  const plan = session?.plan ?? null;

  const groups: { name: string; rows: [string, string][] }[] = [
    {
      name: 'Session',
      rows: [
        ['Title', title],
        ['Media id', mediaId],
        ['Session', session?.sessionId ?? 'not started'],
        ['Mode', session?.mode ?? 'deciding'],
        ['Reused', session === null ? 'deciding' : describeTranscodeReuse(session.reuse)],
        ['Starts at', formatDuration(sessionStartSeconds)],
        ['Quality asked', quality],
        [
          'Delivery',
          session === null ? 'none' : session.delivery.kind === 'hls' ? 'HLS' : 'Direct',
        ],
      ],
    },
    {
      name: 'Source',
      rows: [
        [
          'Video',
          detail === null
            ? 'unknown'
            : `${detail.videoCodec} ${sizeOf(detail.width, detail.height)} ${detail.videoRange}`,
        ],
        [
          'Audio',
          audio === null
            ? 'none'
            : `${audio.codec} ${audio.channels.toString()}ch ${audio.language ?? ''}`.trim(),
        ],
        [
          'Subtitles',
          detail === null || detail.subtitleStreams.length === 0
            ? 'none'
            : `${detail.subtitleStreams.length.toString()} tracks`,
        ],
      ],
    },
    {
      name: 'Output',
      rows: [
        ['Size', sizeOf(reading.width, reading.height)],
        ['Range', reading.range ?? 'not reported'],
        ['Container', reading.mimeType ?? 'not reported'],
        [
          'Bitrate',
          reading.bitrate === null
            ? 'not reported'
            : `${Math.round(reading.bitrate / 1000).toString()}kbps`,
        ],
        [
          'Frame rate',
          reading.frameRate === null ? 'not reported' : `${reading.frameRate.toFixed(3)}fps`,
        ],
      ],
    },
    {
      name: 'Plan',
      rows: [
        [
          'Container',
          plan === null
            ? 'deciding'
            : describeAxis(plan.container.kind, plan.container.reason.detail),
        ],
        ['Video', plan === null ? 'deciding' : describeVideoAxis(plan.video)],
        ['Audio', plan === null ? 'deciding' : describeAudioAxis(plan.audio)],
        [
          'Subtitles',
          plan === null
            ? 'deciding'
            : describeAxis(plan.subtitles.kind, plan.subtitles.reason.detail),
        ],
      ],
    },
    {
      name: 'Playback',
      rows: [
        ['Position', formatDuration(reading.positionSeconds)],
        [
          'Buffered ahead',
          `${Math.max(0, reading.bufferedSeconds - reading.positionSeconds).toFixed(1)}s`,
        ],
      ],
    },
    ...(session === null || session.warnings.length === 0
      ? []
      : [
          {
            name: 'Warnings',
            rows: [['From the server', session.warnings.join(' · ')]] satisfies [string, string][],
          },
        ]),
  ];

  return (
    <View style={styles.corner} pointerEvents="none">
      <Glass cornerRadius={tokens.radii.xl} style={styles.panel}>
        <Text style={styles.title}>Stats for nerds</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.groups}>
          {groups.map((group) => (
            <View key={group.name} style={styles.group}>
              <Text style={styles.heading}>{group.name}</Text>

              {group.rows.map(([name, value]) => (
                <View key={name} style={styles.row}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </Glass>
    </View>
  );
};

StreamStats.displayName = 'StreamStats';

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    top: tokens.space.xl,
    left: tokens.space.edge,
    bottom: tokens.space.xl * 3,
    width: WIDTH,
  },
  panel: {
    maxHeight: '100%',
    padding: tokens.space.md,
    borderRadius: tokens.radii.xl,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '700',
    marginBottom: tokens.space.sm,
  },
  groups: { gap: tokens.space.sm },
  group: { gap: 2 },
  heading: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small - 6,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  row: { flexDirection: 'row', gap: tokens.space.sm },
  name: { width: 200, color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
  value: {
    flex: 1,
    color: tokens.colours.text,
    fontSize: tokens.type.small - 4,
    fontVariant: ['tabular-nums'],
  },
});

export { StreamStats };
