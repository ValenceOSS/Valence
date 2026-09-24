import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import type { ABookPictureProps } from './ABookPicture.types';

const UNTIL_LOADED = 1.5;

const styles = StyleSheet.create({
  picture: { alignSelf: 'center', maxWidth: '100%', width: '100%' },
});

/**
 * A picture in a book's text, as wide as the text and as tall as its shape says — from the width
 * and height the book gives it where it gives them, and from the picture itself once it has loaded
 * where it does not.
 *
 * @param address - Where the picture is.
 * @param label - What it shows, for somebody who cannot see it.
 * @param ratio - Its width over its height, where the book says.
 */
const ABookPicture = ({ address, label, ratio }: ABookPictureProps) => {
  const [loaded, setLoaded] = useState<number | null>(null);

  return (
    <Image
      style={[styles.picture, { aspectRatio: ratio ?? loaded ?? UNTIL_LOADED }]}
      resizeMode="contain"
      source={{ uri: address }}
      onLoad={({ nativeEvent }) => {
        const { width, height } = nativeEvent.source;

        if (width > 0 && height > 0) {
          setLoaded(width / height);
        }
      }}
      {...(label === null ? { accessibilityElementsHidden: true } : { accessibilityLabel: label })}
      accessibilityIgnoresInvertColors
    />
  );
};

ABookPicture.displayName = 'ABookPicture';

export { ABookPicture };
