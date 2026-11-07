import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import type { ABookPictureProps } from './ABookPicture.types';

const UNTIL_LOADED = 1.5;

const styles = StyleSheet.create({
  box: { justifyContent: 'center', width: '100%' },
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
 * @param line - The height of a line of the text around it, where its room is to be a whole number
 *   of lines, so a page of text below it still breaks between lines rather than through one.
 */
const ABookPicture = ({ address, label, ratio, line }: ABookPictureProps) => {
  const [loaded, setLoaded] = useState<number | null>(null);
  const [wide, setWide] = useState(0);
  const shape = ratio ?? loaded ?? UNTIL_LOADED;
  const room = line === undefined || wide === 0 ? null : Math.ceil(wide / shape / line) * line;

  const picture = (
    <ARemotePicture
      style={[styles.picture, { aspectRatio: shape }]}
      fit="contain"
      uri={address}
      onLoad={({ width, height }) => {
        if (width > 0 && height > 0) {
          setLoaded(width / height);
        }
      }}
      {...(label === null ? {} : { label })}
    />
  );

  return line === undefined ? (
    picture
  ) : (
    <View
      style={[styles.box, room === null ? null : { height: room }]}
      onLayout={({ nativeEvent }) => {
        setWide(nativeEvent.layout.width);
      }}
    >
      {picture}
    </View>
  );
};

ABookPicture.displayName = 'ABookPicture';

export { ABookPicture };
