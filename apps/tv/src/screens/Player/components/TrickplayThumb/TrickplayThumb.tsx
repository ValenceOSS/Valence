import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { thumbnailAt } from '@ValenceClient/playback/fetchTrickplay';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeadersFor } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TrickplayThumbProps } from './TrickplayThumb.types';

/**
 * The picture at a moment in a title, cut from the sprite sheets the server keeps of it: the sheet
 * holding that moment is drawn whole, grown to the width asked for, and moved so only the one tile
 * shows through a window the size of a tile. Each sheet's size is worked out from the tiles on it,
 * since the index says where each tile sits but not how large a sheet is.
 *
 * @param trickplay - The title's thumbnails.
 * @param seconds - The moment to show.
 * @param width - How wide to draw it; its height follows the tiles' shape.
 */
const TrickplayThumb = ({ trickplay, seconds, width }: TrickplayThumbProps) => {
  const sheets = useMemo(() => {
    const sizes = new Map<string, { width: number; height: number }>();

    for (const tile of trickplay.thumbnails) {
      const had = sizes.get(tile.sheetUrl) ?? { width: 0, height: 0 };

      sizes.set(tile.sheetUrl, {
        width: Math.max(had.width, tile.x + tile.width),
        height: Math.max(had.height, tile.y + tile.height),
      });
    }

    return sizes;
  }, [trickplay]);

  const tile = thumbnailAt(trickplay.thumbnails, seconds);
  const grows = width / trickplay.width;
  const height = Math.round(trickplay.height * grows);

  if (tile === null) {
    return <View style={[styles.window, { width, height }]} />;
  }

  const sheet = sheets.get(tile.sheetUrl) ?? { width: tile.width, height: tile.height };
  const address = onTheServer(tile.sheetUrl);

  return (
    <View style={[styles.window, { width, height }]}>
      <Image
        source={{ uri: address, headers: signedHeadersFor(tile.sheetUrl) }}
        cachePolicy="memory-disk"
        contentFit="fill"
        style={{
          position: 'absolute',
          width: sheet.width * grows,
          height: sheet.height * grows,
          left: -tile.x * grows,
          top: -tile.y * grows,
        }}
      />
    </View>
  );
};

TrickplayThumb.displayName = 'TrickplayThumb';

const styles = StyleSheet.create({
  window: {
    overflow: 'hidden',
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colours.raised,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
});

export { TrickplayThumb };
