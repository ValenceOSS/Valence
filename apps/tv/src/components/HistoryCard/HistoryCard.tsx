import { StyleSheet, Text, View } from 'react-native';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HistoryCardProps } from './HistoryCard.types';
import { say } from '@ValenceI18n/say';

const SHADOW_REACH = 12;

const WIDE = 480;

const styles = StyleSheet.create({
  picture: {
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  title: {
    marginTop: tokens.space.sm,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
  when: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
});

/**
 * A film or a programme this viewer lately watched, as a wide card: the picture of what they watched
 * last — the episode's own still, or the film's backdrop — what it was, the episode where it is a
 * programme, and when, with that it was finished where it was or how far they got where they
 * stopped part way.
 *
 * @param watched - The title, and its latest viewing.
 * @param width - How wide to draw it.
 * @param watchedFraction - How far through what was watched last this viewer is, where they stopped
 *   part way.
 * @param onPress - Told it was chosen.
 * @param onFocus - Told the remote has come to rest on it.
 */
const HistoryCard = ({
  watched,
  width = WIDE,
  watchedFraction,
  onPress,
  onFocus,
}: HistoryCardProps) => {
  const { latest } = watched;
  const height = Math.round((width * 9) / 16);
  const what = latest.seriesTitle ?? latest.title ?? say('common.something');
  const when = [
    latest.seriesTitle === null ? null : latest.title,
    describeWhen(new Date(latest.lastWatchedAt), new Date()),
    latest.isFinished ? say('common.finished') : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <Focusable
      label={`${what}, ${when}`}
      shadow={{ height, cornerRadius: tokens.radii.lg, reach: SHADOW_REACH }}
      scale={1.06}
      onFocus={() => {
        onFocus(watched);
      }}
      onPress={() => {
        onPress(watched);
      }}
    >
      <View style={{ width }}>
        <View style={[styles.picture, { width, height }]}>
          <Artwork
            path={artworkUrl(latest.mediaItemId, 'backdrop', { size: 'medium' })}
            style={StyleSheet.absoluteFill}
          />

          {watchedFraction === undefined ? null : <ProgressLine fraction={watchedFraction} />}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {what}
        </Text>
        <Text numberOfLines={1} style={styles.when}>
          {when}
        </Text>
      </View>
    </Focusable>
  );
};

HistoryCard.displayName = 'HistoryCard';

export { HistoryCard };
