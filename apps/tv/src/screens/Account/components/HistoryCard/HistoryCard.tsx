import { StyleSheet, Text, View } from 'react-native';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HistoryCardProps } from './HistoryCard.types';
import { say } from '@ValenceI18n/say';

const SHADOW_REACH = 12;

const PICTURE = { width: 480, height: 270 };

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
 * Something this viewer lately watched, as a wide card: its picture — the episode's own still, or
 * the film's backdrop — what it was, and when, with that it was finished where it was.
 *
 * @param viewing - What was watched.
 * @param onPress - Told it was chosen.
 * @param onFocus - Told the remote has come to rest on it.
 */
const HistoryCard = ({ viewing, onPress, onFocus }: HistoryCardProps) => {
  const what = viewing.seriesTitle ?? viewing.title ?? say('common.something');
  const when = [
    viewing.seriesTitle === null ? null : viewing.title,
    describeWhen(new Date(viewing.lastWatchedAt), new Date()),
    viewing.isFinished ? say('common.finished') : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <Focusable
      label={`${what}, ${when}`}
      shadow={{ height: PICTURE.height, cornerRadius: tokens.radii.lg, reach: SHADOW_REACH }}
      scale={1.06}
      onFocus={() => {
        onFocus(viewing);
      }}
      onPress={() => {
        onPress(viewing);
      }}
    >
      <View style={{ width: PICTURE.width }}>
        <View style={[styles.picture, PICTURE]}>
          <Artwork
            path={artworkUrl(viewing.mediaItemId, 'backdrop', { size: 'medium' })}
            style={StyleSheet.absoluteFill}
          />
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
