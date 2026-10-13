import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TheStatsProps } from './TheStats.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 6,
    padding: 14,
  },
  cardHeading: {
    color: PLAYER_LOOK.colours.quiet,
    fontFamily: FONTS.sans.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 24, paddingTop: 16 },
  heading: { ...PLAYER_LOOK.styles.heading, paddingRight: 60 },
  name: {
    color: PLAYER_LOOK.colours.quiet,
    fontFamily: FONTS.sans.semibold,
    fontSize: 12,
    width: 110,
  },
  row: { flexDirection: 'row', gap: 10 },
  value: {
    color: PLAYER_LOOK.colours.text,
    flex: 1,
    fontFamily: FONTS.sans.semibold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});

/**
 * Stats for nerds: everything Valence knows about what is on screen and how it got there — the
 * session, what the file holds, what this phone is being sent, what the server decided to do with
 * each part of it and why, and how playing is faring — laid out in cards that read again each
 * second while the film carries on underneath.
 *
 * @param groups - The cards and their rows, as the web and the television describe them.
 * @param onClose - Told to close it.
 */
const TheStats = ({ groups, onClose }: TheStatsProps) => (
  <APlayerPanel label={say('phone.watching.closeTheStats')} onClose={onClose}>
    <Text style={styles.heading}>{say('common.statsForNerds')}</Text>

    <ScrollView contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>
      {groups.map((group) => (
        <View key={group.name} style={styles.card}>
          <Text style={styles.cardHeading}>{group.name}</Text>

          {group.rows.map(([name, value]) => (
            <View key={name} style={styles.row}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.value} selectable>
                {value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  </APlayerPanel>
);

TheStats.displayName = 'TheStats';

export { TheStats };
