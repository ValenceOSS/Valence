import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { Button } from '@ValencePhone/components/Button/Button';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { Words } from '@ValencePhone/components/Words/Words';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheFeaturedProps } from './TheFeatured.types';

const GAP = 12;

const styles = StyleSheet.create({
  backdrop: { height: '100%', width: '100%' },
  card: { aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { borderRadius: 3, height: 6, width: 6 },
  foot: { bottom: 0, gap: 2, left: 0, padding: 14, position: 'absolute', right: 0 },
  logo: { height: 48, width: '60%' },
  shade: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    bottom: 0,
    height: '45%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  whole: { gap: 10 },
});

/**
 * A handful of things from the library, large, one to a swipe, as the web's home opens on.
 *
 * Each shows its logo where the library has one and its name where it does not, over its backdrop.
 * An episode is shown as its programme and opens it.
 *
 * @param items - What to feature.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 */
const TheFeatured = ({ items, onLookAt, onLookAtShow }: TheFeaturedProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const [at, setAt] = useState(0);
  const across = width - SCREEN_EDGE * 2;

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.whole}>
      <ScrollView
        horizontal
        snapToInterval={across + GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: GAP }}
        onMomentumScrollEnd={(event) => {
          setAt(Math.round(event.nativeEvent.contentOffset.x / (across + GAP)));
        }}
      >
        {items.map((media) => {
          const showId = showIdOf(media);
          const title = showId === null ? media.title : (media.seriesTitle ?? media.title);

          return (
            <Button
              key={media.id}
              tone="bare"
              label={title}
              onPress={() => {
                if (showId === null) {
                  onLookAt(media.id);
                } else {
                  onLookAtShow(media.libraryId, showId);
                }
              }}
            >
              <View
                style={[styles.card, { backgroundColor: colours.surfaceRaised, width: across }]}
              >
                {media.hasBackdrop ? (
                  <Image
                    style={styles.backdrop}
                    source={{ uri: onThisServer(`/api/media/${media.id}/image/backdrop`) }}
                    accessibilityIgnoresInvertColors
                  />
                ) : null}

                <View style={styles.shade} />

                <View style={styles.foot}>
                  {media.hasLogo ? (
                    <Image
                      style={styles.logo}
                      resizeMode="contain"
                      source={{ uri: onThisServer(`/api/media/${media.id}/image/logo?at=full`) }}
                      accessibilityLabel={title}
                    />
                  ) : (
                    <Words size="heading" lines={2}>
                      {title}
                    </Words>
                  )}

                  {media.year === null ? null : (
                    <Words size="small" tone="muted">
                      {media.year}
                    </Words>
                  )}
                </View>
              </View>
            </Button>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {items.map((media, index) => (
          <View
            key={media.id}
            style={[styles.dot, { backgroundColor: index === at ? colours.text : colours.border }]}
          />
        ))}
      </View>
    </View>
  );
};

TheFeatured.displayName = 'TheFeatured';

export { TheFeatured };
