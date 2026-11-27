import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { User } from '@keyline-icons/react-native';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CastPortraitProps } from './CastPortrait.types';

const FIGURE = 72;

/**
 * Somebody's photograph in a cast, loaded as every other picture on the television is, and kept in
 * memory once it has been; where the catalogue has none, or it will not load, the figure the web
 * draws for a face nobody has a picture of stands in its place, so the row never shows a hole.
 *
 * @param imageUrl - Where their photograph is, or nothing where there is none.
 * @param size - How big it is drawn.
 */
const CastPortrait = ({ imageUrl, size }: CastPortraitProps) => {
  const [missing, setMissing] = useState<string | null>(null);
  const isMissing = imageUrl === null || missing === imageUrl;

  return (
    <View style={[styles.portrait, size]}>
      {isMissing ? (
        <View style={styles.figure} accessibilityElementsHidden importantForAccessibility="no">
          <Icon of={User} size={FIGURE} colour={tokens.colours.muted} />
        </View>
      ) : (
        <Artwork
          path={imageUrl}
          style={StyleSheet.absoluteFill}
          onMissing={() => {
            setMissing(imageUrl);
          }}
        />
      )}
    </View>
  );
};

CastPortrait.displayName = 'CastPortrait';

const styles = StyleSheet.create({
  portrait: {
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colours.raised,
  },
  figure: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export { CastPortrait };
