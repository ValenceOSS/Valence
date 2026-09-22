import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { theArtworkFor } from '@ValencePhone/components/APoster/theArtworkFor';
import type { APosterProps } from './APoster.types';

const WIDTH = 104;

const RATIO = 3 / 2;

const styles = StyleSheet.create({
  title: { color: '#f6fbf9', fontSize: 13 },
  tile: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    height: WIDTH * RATIO,
    justifyContent: 'center',
    overflow: 'hidden',
    width: WIDTH,
  },
  poster: { height: '100%', width: '100%' },
  standIn: { color: '#6b7176', fontSize: 11, padding: 8, textAlign: 'center' },
  whole: { gap: 6, width: WIDTH },
  year: { color: '#9aa0a6', fontSize: 11 },
});

/**
 * Draws one title as its poster, falling back to its name where there is no artwork or the server
 * cannot produce it.
 *
 * @param media - The title to draw.
 */
const APoster = ({ media }: APosterProps) => {
  const [isMissing, setIsMissing] = useState(false);
  const artwork = theArtworkFor(media);

  return (
    <View style={styles.whole}>
      <View style={styles.tile}>
        {artwork === null || isMissing ? (
          <Text style={styles.standIn} numberOfLines={4}>
            {media.title}
          </Text>
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

      <Text style={styles.title} numberOfLines={2}>
        {media.title}
      </Text>

      {media.year === null ? null : <Text style={styles.year}>{media.year}</Text>}
    </View>
  );
};

APoster.displayName = 'APoster';

export { APoster };
