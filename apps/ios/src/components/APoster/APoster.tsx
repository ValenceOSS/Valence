import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { POSTER_WIDTH } from '@ValencePhone/components/APoster/POSTER_WIDTH';
import { HowFar } from '@ValencePhone/components/HowFar/HowFar';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { APosterProps } from './APoster.types';

const RATIO = 3 / 2;

const styles = StyleSheet.create({
  howFar: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  poster: { height: '100%', width: '100%' },
  standIn: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  tile: { borderRadius: 12, overflow: 'hidden' },
  whole: { gap: 6 },
});

/**
 * Draws one title as its poster, falling back to its name where there is no artwork or the server
 * cannot produce it.
 *
 * How far through it somebody is, is drawn as a line across the foot and said out loud as a
 * percentage, because a line is nothing to anybody who cannot see it.
 *
 * It draws what it is given rather than working it out from a film, so a programme — which has no
 * file of its own and borrows its picture from an episode — is drawn by the same thing.
 *
 * @param title - What it is called.
 * @param year - When it came out, where that is known.
 * @param artwork - Where its picture is, or nothing where it has none.
 * @param watched - How much of it has been seen, as a fraction, where any of it has.
 * @param note - A word about where it stands, such as whether it is already here.
 * @param wide - How wide to draw it, where it fills a cell rather than sitting on a shelf.
 */
const APoster = ({
  title,
  year = null,
  artwork,
  watched = 0,
  note = null,
  wide = POSTER_WIDTH,
}: APosterProps) => {
  const [isMissing, setIsMissing] = useState(false);
  const colours = useTheColours();
  const size = { height: wide * RATIO, width: wide };

  return (
    <View style={[styles.whole, { width: wide }]}>
      <View style={[styles.tile, size, { backgroundColor: colours.surfaceRaised }]}>
        {artwork === null || isMissing ? (
          <View style={[styles.tile, size, styles.standIn]}>
            <Words size="small" tone="muted" lines={4}>
              {title}
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

        {watched > 0 ? (
          <View style={styles.howFar}>
            <HowFar fraction={watched} label={`How far through ${title}`} />
          </View>
        ) : null}
      </View>

      <Words size="small" lines={2}>
        {title}
      </Words>

      {year === null ? null : (
        <Words size="small" tone="muted">
          {year}
        </Words>
      )}

      {note === null ? null : (
        <Words size="small" tone="accent" lines={1}>
          {note}
        </Words>
      )}
    </View>
  );
};

APoster.displayName = 'APoster';

export { APoster };
