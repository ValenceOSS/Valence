import { StyleSheet, Text, View } from 'react-native';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { joinFacts } from '@ValenceTv/library/joinFacts';
import { tokens } from '@ValenceTv/theme/tokens';
import type { EpisodeCardProps } from './EpisodeCard.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';

const WIDTH = 420;

const STILL_HEIGHT = 236;

/**
 * One episode of a programme: a still from it, its number and name, how long it runs and what
 * happens in it, so it is chosen by what somebody remembers seeing rather than by its number alone.
 *
 * @param episode - The episode.
 * @param overview - What happens in it, where the catalogue says.
 * @param watchedFraction - How far through it this viewer is, where they have started it.
 * @param isWatched - Whether they have finished it.
 * @param onPress - Told when it is chosen.
 * @param onHold - Told when select is held on it, which marks it watched or unwatched.
 */
const EpisodeCard = ({
  episode,
  overview,
  watchedFraction,
  isWatched = false,
  onPress,
  onHold,
}: EpisodeCardProps) => (
  <Focusable
    label={episode.title}
    shadow={{ height: STILL_HEIGHT, cornerRadius: tokens.radii.xl }}
    onPress={() => {
      onPress(episode);
    }}
    {...(onHold === undefined
      ? {}
      : {
          onHold: () => {
            onHold(episode);
          },
        })}
  >
    {(isFocused) => (
      <View style={styles.card}>
        <View style={styles.still}>
          <Artwork
            path={episode.hasBackdrop ? artworkUrl(episode.id, 'backdrop') : null}
            style={StyleSheet.absoluteFill}
          />

          {watchedFraction === undefined || isWatched ? null : (
            <ProgressLine fraction={watchedFraction} />
          )}
        </View>

        <Text numberOfLines={1} style={[styles.name, isFocused && styles.nameFocused]}>
          {typeof episode.episodeNumber === 'number'
            ? `${describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd)}. ${episode.title}`
            : episode.title}
        </Text>

        <Text style={styles.facts}>
          {joinFacts([formatDuration(episode.durationSeconds), isWatched ? 'Watched' : null])}
        </Text>

        {overview === undefined || overview === null ? null : (
          <Text numberOfLines={2} style={styles.overview}>
            {overview}
          </Text>
        )}
      </View>
    )}
  </Focusable>
);

EpisodeCard.displayName = 'EpisodeCard';

const styles = StyleSheet.create({
  card: { width: WIDTH, gap: tokens.space.xs },
  still: {
    width: WIDTH,
    height: STILL_HEIGHT,
    borderRadius: tokens.radii.xl,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
    marginBottom: tokens.space.xs,
  },
  name: { color: tokens.colours.muted, fontSize: tokens.type.small, fontWeight: '600' },
  nameFocused: { color: tokens.colours.text },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.small - 2 },
  overview: { color: tokens.colours.muted, fontSize: tokens.type.small - 2, lineHeight: 28 },
});

export { EpisodeCard };
