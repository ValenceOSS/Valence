import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MusicNote, User } from '@keyline-icons/react-native';
import { Heart } from '@keyline-icons/react-native/fill';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MusicCoverProps } from './MusicCover.types';

const LIKED_FROM = '#4f3bd9';

/**
 * The square picture of something to listen to — an album's cover, a playlist's, an artist's
 * picture drawn round — or, where there is none, a quiet note in its place. Liked songs are a
 * heart on violet, as they are on the web.
 *
 * @param kind - What it is the picture of.
 * @param art - Where the picture is served, where there is one.
 * @param size - How wide and tall it is.
 * @param isUrgent - Whether it is fetched ahead of the others.
 * @param crossfadeMs - How long a new picture takes to dissolve in over the old one.
 * @param style - Anything else about how it is laid out.
 */
const MusicCover = ({ kind, art, size, isUrgent = false, crossfadeMs, style }: MusicCoverProps) => {
  const [isMissing, setIsMissing] = useState(false);
  const isRound = kind === 'artist';
  const shape = {
    width: size,
    height: size,
    borderRadius: isRound ? size / 2 : tokens.radii.lg,
  };
  const mark = Math.round(size * 0.36);

  if (kind === 'liked') {
    return (
      <View style={[styles.cover, styles.liked, shape, style]}>
        <Icon of={Heart} size={mark} colour="#ffffff" />
      </View>
    );
  }

  return (
    <View style={[styles.cover, shape, style]}>
      {art === null || isMissing ? (
        <Icon of={isRound ? User : MusicNote} size={mark} colour={tokens.colours.muted} />
      ) : (
        <Artwork
          path={art}
          style={StyleSheet.absoluteFill}
          isUrgent={isUrgent}
          {...(crossfadeMs === undefined ? {} : { crossfadeMs })}
          onMissing={() => {
            setIsMissing(true);
          }}
        />
      )}
    </View>
  );
};

MusicCover.displayName = 'MusicCover';

const styles = StyleSheet.create({
  cover: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colours.raised,
  },
  liked: { backgroundColor: LIKED_FROM },
});

export { MusicCover };
