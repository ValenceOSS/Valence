import { MusicNote } from '@keyline-icons/react-native';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AMusicTileProps } from './AMusicTile.types';

const SIDE = 148;

const styles = StyleSheet.create({
  art: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fills: { height: '100%', width: '100%' },
  said: { gap: 2 },
  whole: { gap: 8 },
});

/**
 * An album, a playlist or an artist on a shelf of music, as the web's music tiles draw them: its
 * cover square — or round, for an artist — with what it is called beneath and a line about it.
 *
 * Where there is no cover, or it will not load, a note is drawn in its place.
 *
 * @param title - What it is called.
 * @param detail - A line about it, where there is one.
 * @param artwork - Its cover, or nothing where it has none.
 * @param isRound - Whether the cover is round, as an artist's is.
 * @param side - How wide it is, for a grid that fills its columns rather than a shelf.
 * @param standIn - What is drawn where there is no cover, where a note would not say what it is.
 * @param onPress - Told somebody wants to open it.
 */
const AMusicTile = ({
  title,
  detail = null,
  artwork,
  isRound = false,
  side = SIDE,
  standIn = MusicNote,
  onPress,
}: AMusicTileProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);

  return (
    <Button tone="bare" label={title} onPress={onPress}>
      <View style={[styles.whole, { width: side }]}>
        <View
          style={[
            styles.art,
            {
              backgroundColor: colours.surfaceRaised,
              borderRadius: isRound ? side / 2 : 12,
              height: side,
              width: side,
            },
          ]}
        >
          {artwork === null || isMissing ? (
            <Icon of={standIn} size={40} colour={colours.textMuted} />
          ) : (
            <Image
              style={styles.fills}
              source={{ uri: artwork }}
              accessibilityIgnoresInvertColors
              onError={() => {
                setIsMissing(true);
              }}
            />
          )}
        </View>

        <View style={styles.said}>
          <Words lines={1} {...(isRound ? { isCentred: true } : {})}>
            {title}
          </Words>
          {detail === null ? null : (
            <Words size="small" tone="muted" lines={1} {...(isRound ? { isCentred: true } : {})}>
              {detail}
            </Words>
          )}
        </View>
      </View>
    </Button>
  );
};

AMusicTile.displayName = 'AMusicTile';

export { AMusicTile };
