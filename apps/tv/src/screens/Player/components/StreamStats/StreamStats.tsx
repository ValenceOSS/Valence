import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { describeStreamStats } from '@ValenceClient/playback/describeStreamStats';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { tokens } from '@ValenceTv/theme/tokens';
import type { StreamStatsProps } from './StreamStats.types';
import { say } from '@ValenceI18n/say';

const WIDTH = 760;

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
  const groups = describeStreamStats({
    title,
    mediaId,
    detail,
    session,
    sessionStartSeconds,
    quality,
    reading,
  });

  return (
    <View style={styles.corner} pointerEvents="none">
      <Glass cornerRadius={tokens.radii.xl} style={styles.panel}>
        <Text style={styles.title}>{say('common.statsForNerds')}</Text>

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
