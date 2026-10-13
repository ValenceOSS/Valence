import { StyleSheet, Text, View } from 'react-native';
import { Words } from '@ValenceMobile/components/Words/Words';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { TheTracksProps } from './TheTracks.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  number: {
    fontFamily: FONTS.sans.semibold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    width: 26,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 7 },
  seconds: { fontFamily: FONTS.sans.medium, fontSize: 13, fontVariant: ['tabular-nums'] },
  title: { flex: 1, fontFamily: FONTS.sans.semibold, fontSize: 15 },
  whole: { gap: 2 },
});

/**
 * An album's songs, numbered and timed, split by disc where there is more than one, with the label
 * it came out on beneath — so somebody can see what they are asking for before they ask.
 *
 * @param tracks - The songs, in order.
 * @param label - The label it came out on, where it is known.
 */
const TheTracks = ({ tracks, label }: TheTracksProps) => {
  const colours = useTheColours();
  const discs = [...new Set(tracks.map((track) => track.disc))];

  return (
    <View style={styles.whole}>
      <Words size="heading">{say('common.songs2')}</Words>

      {discs.map((disc) => (
        <View key={disc}>
          {discs.length < 2 ? null : (
            <Words size="small" tone="muted">
              {say('screens.albumTracks.discNumber', { number: disc.toString() })}
            </Words>
          )}

          {tracks
            .filter((track) => track.disc === disc)
            .map((track) => (
              <View key={`${disc.toString()}-${track.number.toString()}`} style={styles.row}>
                <Text style={[styles.number, { color: colours.textMuted }]}>{track.number}</Text>
                <Text style={[styles.title, { color: colours.text }]} numberOfLines={1}>
                  {track.title}
                </Text>
                {track.seconds === null ? null : (
                  <Text style={[styles.seconds, { color: colours.textMuted }]}>
                    {formatDuration(track.seconds)}
                  </Text>
                )}
              </View>
            ))}
        </View>
      ))}

      {label === null ? null : (
        <Words size="small" tone="muted">
          {label}
        </Words>
      )}
    </View>
  );
};

TheTracks.displayName = 'TheTracks';

export { TheTracks };
