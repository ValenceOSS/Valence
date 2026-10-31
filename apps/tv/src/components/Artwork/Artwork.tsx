import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeadersFor } from '@ValenceTv/platform/theSessionToken';
import { pictureSource } from '@ValenceTv/platform/pictureSource';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ArtworkProps } from './Artwork.types';

/**
 * A picture the server keeps — a poster, a backdrop, a logo — asked for as whoever is signed in.
 *
 * What has no picture, or whose picture will not load, shows the raised surface it would have sat
 * on, so a shelf keeps its shape rather than collapsing around a gap. Another picture asked for in
 * its place is tried afresh, so one that failed does not leave the space empty for the next.
 *
 * It appears at once rather than fading in, and is kept in memory as well as on disk, so a shelf
 * scrolled back to draws straight from memory. Each picture is known by where it is served, so a
 * card reused for another title never shows the last one's picture while the new one arrives.
 *
 * @param path - Where the server serves it, or nothing where there is none.
 * @param style - Its size and shape.
 * @param fit - Whether it fills the space or fits inside it.
 * @param onMissing - Told when the picture will not load, for a caller with something else to show.
 * @param anchor - Which edge, or corner, a picture that does not fill its space keeps to.
 * @param isUrgent - Whether it is loaded ahead of the rest, as the picture filling the screen and
 *   the first shelf's are.
 * @param crossfadeMs - How long a new picture takes to dissolve in over the old, where it changes
 *   in place rather than arriving.
 */
const Artwork = ({
  path,
  style,
  fit = 'cover',
  onMissing,
  anchor = 'center',
  isUrgent = false,
  crossfadeMs,
}: ArtworkProps) => {
  const [missing, setMissing] = useState<string | null>(null);
  const isMissing = path !== null && missing === path;

  return (
    <View style={[styles.frame, style]}>
      {path === null || isMissing ? null : (
        <Image
          source={pictureSource(onTheServer(path), signedHeadersFor(path))}
          style={StyleSheet.absoluteFill}
          contentFit={fit}
          contentPosition={anchor === 'bottomLeft' ? { left: 0, bottom: 0 } : anchor}
          priority={isUrgent ? 'high' : 'normal'}
          cachePolicy="memory-disk"
          {...(crossfadeMs === undefined
            ? { recyclingKey: path }
            : { transition: { duration: crossfadeMs, effect: 'cross-dissolve' } })}
          onError={() => {
            setMissing(path);
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
