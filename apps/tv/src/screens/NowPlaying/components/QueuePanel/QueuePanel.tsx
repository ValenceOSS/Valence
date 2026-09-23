import { FlatList, StyleSheet, Text, TVFocusGuideView } from 'react-native';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { TrackRow } from '@ValenceTv/components/TrackRow/TrackRow';
import { tokens } from '@ValenceTv/theme/tokens';
import type { QueuePanelProps } from './QueuePanel.types';

const WIDTH = 820;

/**
 * What plays after this song, in a panel down the right of the screen as the player's settings
 * are: every song still to come, in the order it will play, and choosing one plays it now. Menu
 * closes the panel, and the remote stays inside it until then.
 *
 * @param upcoming - The songs still to come, each with where it sits in the order.
 * @param onJump - Told where in the order the chosen song sits.
 */
const QueuePanel = ({ upcoming, onJump }: QueuePanelProps) => (
  <TVFocusGuideView style={styles.panel} trapFocusLeft trapFocusRight trapFocusUp trapFocusDown>
    <FadeIn>
      <Text style={styles.title}>Up next</Text>

      {upcoming.length === 0 ? (
        <Text style={styles.empty}>Nothing plays after this song.</Text>
      ) : (
        <FlatList
          data={upcoming}
          keyExtractor={(entry) => `${entry.at.toString()}:${entry.track.id}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TrackRow
              track={item.track}
              place={index}
              isCurrent={false}
              isPlaying={false}
              onPress={() => {
                onJump(item.at);
              }}
            />
          )}
        />
      )}
    </FadeIn>
  </TVFocusGuideView>
);

QueuePanel.displayName = 'QueuePanel';

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: WIDTH,
    paddingTop: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
    backgroundColor: 'rgba(12,12,12,0.92)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  empty: {
    color: tokens.colours.muted,
    fontSize: tokens.type.body,
    paddingHorizontal: tokens.space.md,
  },
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
});

export { QueuePanel };
