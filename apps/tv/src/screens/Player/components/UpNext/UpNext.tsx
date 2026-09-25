import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SkipForward, X } from '@keyline-icons/react-native';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Button } from '@ValenceTv/components/Button/Button';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { UpNextProps } from './UpNext.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';

const COUNTS_FROM = 10;

const A_SECOND = 1000;

const STILL = { width: 400, height: 225 };

/**
 * The card in the corner as an episode's credits roll, saying what comes next: its still, its place
 * and name, and a count down to starting it on its own — or, when enough have followed on without
 * anybody touching the remote, asking whether anybody is still there rather than counting.
 *
 * @param episode - What comes next.
 * @param isAsking - Whether to ask rather than count down.
 * @param onPlay - Told to start it, by the button or at the end of the count.
 * @param onStay - Told to stay with the credits instead.
 */
const UpNext = ({ episode, isAsking, onPlay, onStay }: UpNextProps) => {
  const [left, setLeft] = useState(COUNTS_FROM);
  const playing = useRef(onPlay);

  useEffect(() => {
    playing.current = onPlay;
  });

  useEffect(() => {
    if (isAsking) {
      return;
    }

    if (left <= 0) {
      playing.current();

      return;
    }

    const timer = setTimeout(() => {
      setLeft((was) => was - 1);
    }, A_SECOND);

    return () => {
      clearTimeout(timer);
    };
  }, [left, isAsking]);

  const name =
    typeof episode.seasonNumber === 'number' && typeof episode.episodeNumber === 'number'
      ? say('tv.player.episodeLine', {
          season: episode.seasonNumber,
          episode: describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd),
          title: episode.title,
        })
      : episode.title;

  return (
    <View style={styles.card}>
      <FadeIn>
        <Artwork
          path={episode.hasBackdrop ? artworkUrl(episode.id, 'backdrop') : null}
          style={[STILL, styles.still]}
        />

        <Text style={styles.label}>
          {isAsking ? say('tv.upNext.stillWatching') : say('tv.upNext.upNext')}
        </Text>
        <Text numberOfLines={2} style={styles.name}>
          {name}
        </Text>

        <View style={styles.actions}>
          <Button
            label={
              isAsking ? say('tv.upNext.keepWatching') : say('tv.upNext.playIn', { seconds: left })
            }
            icon={SkipForward}
            variant="confirm"
            size="md"
            hasPreferredFocus
            onPress={onPlay}
          />
          <Button
            label={say('tv.upNext.stay')}
            icon={X}
            variant="overlay"
            size="md"
            onPress={onStay}
          />
        </View>
      </FadeIn>
    </View>
  );
};

UpNext.displayName = 'UpNext';

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    right: tokens.space.edge,
    bottom: tokens.space.xl * 2 + tokens.space.lg,
    width: STILL.width,
  },
  still: { borderRadius: tokens.radii.lg, marginBottom: tokens.space.sm },
  label: { color: tokens.colours.muted, fontSize: tokens.type.small },
  name: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: tokens.space.sm, marginTop: tokens.space.sm },
});

export { UpNext };
