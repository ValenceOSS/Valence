import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { theArtworkFor } from '@ValencePhone/components/APoster/theArtworkFor';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { APosterProps } from './APoster.types';

const WIDTH = 104;

const RATIO = 3 / 2;

const styles = StyleSheet.create({
  poster: { height: '100%', width: '100%' },
  standIn: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  tile: {
    borderRadius: 12,
    height: WIDTH * RATIO,
    overflow: 'hidden',
    width: WIDTH,
  },
  whole: { gap: 6, width: WIDTH },
});

/**
 * Draws one title as its poster, falling back to its name where there is no artwork or the server
 * cannot produce it.
 *
 * @param media - The title to draw.
 */
const APoster = ({ media }: APosterProps) => {
  const [isMissing, setIsMissing] = useState(false);
  const colours = useTheColours();
  const artwork = theArtworkFor(media);

  return (
    <View style={styles.whole}>
      <View style={[styles.tile, { backgroundColor: colours.surfaceRaised }]}>
        {artwork === null || isMissing ? (
          <View style={[styles.tile, styles.standIn]}>
            <Words size="small" tone="muted" lines={4}>
              {media.title}
            </Words>
          </View>
        ) : (
          <Image
            style={styles.poster}
            source={{ uri: artwork }}
            onError={() => {
              setIsMissing(true);
            }}
            accessibilityIgnoresInvertColors
          />
        )}
      </View>

      <Words size="small" lines={2}>
        {media.title}
      </Words>

      {media.year === null ? null : (
        <Words size="small" tone="muted">
          {media.year}
        </Words>
      )}
    </View>
  );
};

APoster.displayName = 'APoster';

export { APoster };
