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
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
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
    ? say('tv.streamStats.notReported')
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
      name: say('tv.streamStats.sessionGroup'),
      rows: [
        [say('tv.streamStats.title'), title],
        [say('tv.streamStats.mediaId'), mediaId],
        [say('tv.streamStats.session'), session?.sessionId ?? say('tv.streamStats.notStarted')],
        [say('tv.streamStats.mode'), session?.mode ?? say('tv.streamStats.deciding')],
        [
          say('tv.streamStats.reused'),
          session === null ? say('tv.streamStats.deciding') : describeTranscodeReuse(session.reuse),
        ],
        [say('tv.streamStats.startsAt'), formatDuration(sessionStartSeconds)],
        [say('tv.streamStats.qualityAsked'), quality],
        [
          say('tv.streamStats.delivery'),
          session === null
            ? say('tv.streamStats.none')
            : session.delivery.kind === 'hls'
              ? say('tv.streamStats.hls')
              : say('tv.streamStats.direct'),
        ],
      ],
    },
    {
      name: say('tv.streamStats.sourceGroup'),
      rows: [
        [
          say('tv.streamStats.video'),
          detail === null
            ? say('tv.streamStats.unknown')
            : `${detail.videoCodec} ${sizeOf(detail.width, detail.height)} ${detail.videoRange}`,
        ],
        [
          say('tv.streamStats.audio'),
          audio === null
            ? say('tv.streamStats.none')
            : `${audio.codec} ${audio.channels.toString()}ch ${audio.language ?? ''}`.trim(),
        ],
        [
          say('tv.streamStats.subtitles'),
          detail === null || detail.subtitleStreams.length === 0
            ? say('tv.streamStats.none')
            : sayCount('tv.streamStats.tracks', detail.subtitleStreams.length),
        ],
      ],
    },
    {
      name: say('tv.streamStats.outputGroup'),
      rows: [
        [say('tv.streamStats.size'), sizeOf(reading.width, reading.height)],
        [say('tv.streamStats.range'), reading.range ?? say('tv.streamStats.notReported')],
        [say('tv.streamStats.container'), reading.mimeType ?? say('tv.streamStats.notReported')],
        [
          say('tv.streamStats.bitrate'),
          reading.bitrate === null
            ? say('tv.streamStats.notReported')
            : `${Math.round(reading.bitrate / 1000).toString()}kbps`,
        ],
        [
          say('tv.streamStats.frameRate'),
          reading.frameRate === null
            ? say('tv.streamStats.notReported')
            : `${reading.frameRate.toFixed(3)}fps`,
        ],
      ],
    },
    {
      name: say('tv.streamStats.planGroup'),
      rows: [
        [
          say('tv.streamStats.container'),
          plan === null
            ? say('tv.streamStats.deciding')
            : describeAxis(plan.container.kind, plan.container.reason.detail),
        ],
        [
          say('tv.streamStats.video'),
          plan === null ? say('tv.streamStats.deciding') : describeVideoAxis(plan.video),
        ],
        [
          say('tv.streamStats.audio'),
          plan === null ? say('tv.streamStats.deciding') : describeAudioAxis(plan.audio),
        ],
        [
          say('tv.streamStats.subtitles'),
          plan === null
            ? say('tv.streamStats.deciding')
            : describeAxis(plan.subtitles.kind, plan.subtitles.reason.detail),
        ],
      ],
    },
    {
      name: say('tv.streamStats.playbackGroup'),
      rows: [
        [say('tv.streamStats.position'), formatDuration(reading.positionSeconds)],
        [
          say('tv.streamStats.bufferedAhead'),
          `${Math.max(0, reading.bufferedSeconds - reading.positionSeconds).toFixed(1)}s`,
        ],
      ],
    },
    ...(session === null || session.warnings.length === 0
      ? []
      : [
          {
            name: say('tv.streamStats.warningsGroup'),
            rows: [[say('tv.streamStats.fromTheServer'), session.warnings.join(' · ')]] satisfies [
              string,
              string,
            ][],
          },
        ]),
  ];

  return (
    <View style={styles.corner} pointerEvents="none">
      <Glass cornerRadius={tokens.radii.xl} style={styles.panel}>
        <Text style={styles.title}>{say('tv.streamStats.heading')}</Text>

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
