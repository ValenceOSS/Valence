import { Check } from '@keyline-icons/react-native';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { POSTER_WIDTH } from '@ValenceMobile/components/APoster/POSTER_WIDTH';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { APosterProps } from './APoster.types';

const RATIO = 3 / 2;

const styles = StyleSheet.create({
  howFar: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  count: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
    position: 'absolute',
    right: 8,
    top: 8,
  },
  countWords: { fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '700' },
  seen: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
  },
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
 * @param watched - How much of it has been seen, as a fraction — a line while part way, a tick once
 *   through — where any of it has.
 * @param count - How many episodes are left to watch, shown in the corner; nothing for none.
 * @param note - A word about where it stands, such as whether it is already here.
 * @param wide - How wide to draw it, where it fills a cell rather than sitting on a shelf.
 */
const APoster = ({
  title,
  year = null,
  artwork,
  watched = 0,
  note = null,
  count = 0,
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

        {count > 0 && watched < 1 ? (
          <View
            style={[styles.count, { backgroundColor: colours.accent }]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${count.toString()} ${count === 1 ? 'episode' : 'episodes'} left`}
          >
            <Text style={[styles.countWords, { color: colours.accentContrast }]}>
              {count > 99 ? '99+' : count.toString()}
            </Text>
          </View>
        ) : null}

        {watched >= 1 ? (
          <View
            style={[styles.seen, { backgroundColor: withAlpha('#000000', 0.6) }]}
            accessible
            accessibilityRole="image"
            accessibilityLabel="Watched"
          >
            <Icon of={Check} size={14} colour="#ffffff" />
          </View>
        ) : null}

        {watched > 0 && watched < 1 ? (
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
