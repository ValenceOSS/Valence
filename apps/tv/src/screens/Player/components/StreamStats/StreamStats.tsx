import { StyleSheet, Text, View } from 'react-native';
import { describeStreamStats } from '@ValenceClient/playback/describeStreamStats';
import { roundUpToNice } from '@ValenceCore/functions/roundUpToNice';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { tokens } from '@ValenceTv/theme/tokens';
import { StatsTile } from './components/StatsTile/StatsTile';
import { StatsGroup } from './components/StatsGroup/StatsGroup';
import { StreamTrend } from './components/StreamTrend/StreamTrend';
import { columnsOf } from './columnsOf';
import { summariseStream } from './summariseStream';
import type { StreamStatsProps } from './StreamStats.types';
import { say } from '@ValenceI18n/say';

const COLUMNS = 3;

const READINGS_CHARTED = 60;

/**
 * Writes a number of kilobits a second as megabits.
 *
 * @param kbps - The kilobits a second.
 * @param places - How many decimal places to write.
 * @returns The megabits, written out.
 */
const describeMbps = (kbps: number, places: number): string =>
  say('client.playback.describeRungCost.valueMbps', { value: (kbps / 1000).toFixed(places) });

/**
 * Writes a number of seconds short.
 *
 * @param seconds - The seconds.
 * @param places - How many decimal places to write.
 * @returns The seconds, written out.
 */
const describeSeconds = (seconds: number, places: number): string =>
  say('screens.videoPlayer.streamStats.valueSeconds', { value: seconds.toFixed(places) });

/**
 * Everything Valence knows about what is on screen and how it got there, laid out as the web's stats
 * for nerds are, at a size read from across the room: the figures that matter most first, then the
 * last minute of the bitrate and of the buffer drawn as charts, then the session, what the file
 * holds, what the television is being sent, what the server decided to do with each part of the
 * file, and how playing is faring, in cards across the top of the picture. It sits over the picture
 * while playing carries on, read again each second, for whoever is working out why a stream looks or
 * behaves as it does.
 *
 * @param title - What is playing.
 * @param mediaId - Its id.
 * @param detail - What the catalogue holds about it.
 * @param session - The session serving it, once one has started.
 * @param sessionStartSeconds - Where the session began, which is not always where playing is now.
 * @param quality - The quality asked for.
 * @param reading - What the player says about playing right now.
 * @param history - The last minute of readings, oldest first, drawn as the charts.
 */
const StreamStats = ({
  title,
  mediaId,
  detail,
  session,
  sessionStartSeconds,
  quality,
  reading,
  history,
}: StreamStatsProps) => {
  const input = { title, mediaId, detail, session, sessionStartSeconds, quality, reading };
  const columns = columnsOf(describeStreamStats(input), COLUMNS);
  const bitrates = history.map((read) => (read.bitrate === null ? null : read.bitrate / 1000));
  const buffered = history.map((read) => Math.max(0, read.bufferedSeconds - read.positionSeconds));
  const bitrateCeiling = roundUpToNice(Math.max(0, ...bitrates.map((kbps) => kbps ?? 0)));
  const bufferCeiling = roundUpToNice(Math.max(0, ...buffered));
  const newestBitrate = bitrates.at(-1) ?? null;
  const newestBuffer = buffered.at(-1) ?? null;

  return (
    <View style={styles.over} pointerEvents="none">
      <Glass cornerRadius={tokens.radii.xl} style={styles.panel}>
        <View style={styles.head}>
          <Text style={styles.title}>{say('common.statsForNerds')}</Text>
          <Text numberOfLines={1} style={styles.playing}>
            {title}
          </Text>
        </View>

        <View style={styles.across}>
          {summariseStream(input).map((item) => (
            <StatsTile key={item.label} label={item.label} value={item.value} />
          ))}
        </View>

        <View style={styles.across}>
          <StreamTrend
            title={say('common.bitrate')}
            label={say('tv.player.streamStats.bitrateOverTime')}
            values={bitrates}
            ceiling={bitrateCeiling}
            scale={describeMbps(bitrateCeiling, 0)}
            newest={newestBitrate === null ? null : describeMbps(newestBitrate, 1)}
            slots={READINGS_CHARTED}
          />
          <StreamTrend
            title={say('screens.videoPlayer.streamStats.buffer')}
            label={say('screens.videoPlayer.streamStats.bufferOverTime')}
            values={buffered}
            ceiling={bufferCeiling}
            scale={describeSeconds(bufferCeiling, 0)}
            newest={newestBuffer === null ? null : describeSeconds(newestBuffer, 1)}
            slots={READINGS_CHARTED}
          />
        </View>

        <View style={styles.across}>
          {columns.map((column, at) => (
            <View key={at} style={styles.column}>
              {column.map((group) => (
                <StatsGroup key={group.name} name={group.name} rows={group.rows} />
              ))}
            </View>
          ))}
        </View>
      </Glass>
    </View>
  );
};

StreamStats.displayName = 'StreamStats';

const styles = StyleSheet.create({
  over: {
    position: 'absolute',
    top: tokens.space.lg,
    left: tokens.space.edge,
    right: tokens.space.edge,
  },
  panel: {
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radii.xl,
    backgroundColor: 'rgba(10,10,10,0.78)',
  },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: tokens.space.md },
  title: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '700' },
  playing: { flex: 1, color: tokens.colours.muted, fontSize: tokens.type.small },
  across: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.sm },
  column: { flex: 1, minWidth: 0, gap: tokens.space.sm },
});

export { StreamStats };
