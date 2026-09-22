import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ArtworkProps } from './Artwork.types';

const FADES_IN_MS = 200;

/**
 * A picture the server keeps — a poster, a backdrop, a logo — asked for as whoever is signed in.
 *
 * What has no picture, or whose picture will not load, shows the raised surface it would have sat
 * on, so a shelf keeps its shape rather than collapsing around a gap.
 *
 * @param path - Where the server serves it, or nothing where there is none.
 * @param style - Its size and shape.
 * @param fit - Whether it fills the space or fits inside it.
 * @param onMissing - Told when the picture will not load, for a caller with something else to show.
 * @param anchor - Which edge a picture that does not fill its space keeps to.
 */
const Artwork = ({ path, style, fit = 'cover', onMissing, anchor = 'center' }: ArtworkProps) => {
  const [isMissing, setIsMissing] = useState(false);

  return (
    <View style={[styles.frame, style]}>
      {path === null || isMissing ? null : (
        <Image
          source={{ uri: onTheServer(path), headers: signedHeaders() }}
          style={StyleSheet.absoluteFill}
          contentFit={fit}
          contentPosition={anchor}
          transition={FADES_IN_MS}
          onError={() => {
            setIsMissing(true);
            onMissing?.();
          }}
        />
      )}
    </View>
  );
};

Artwork.displayName = 'Artwork';

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: tokens.colours.raised },
});

export { Artwork };
