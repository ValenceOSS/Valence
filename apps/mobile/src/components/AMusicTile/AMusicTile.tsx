import { MusicNote } from '@keyline-icons/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ACoverGrid } from '@ValenceMobile/components/ACoverGrid/ACoverGrid';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
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
 * @param albumIds - The albums whose covers make up its cover instead, four in a grid, for a list of
 *   songs from many albums.
 * @param isRound - Whether the cover is round, as an artist's is.
 * @param side - How wide it is, for a grid that fills its columns rather than a shelf.
 * @param standIn - What is drawn where there is no cover, where a note would not say what it is.
 * @param onPress - Told somebody wants to open it.
 * @param onLongPress - Told somebody held it down, for what else can be done with it.
 */
const AMusicTile = ({
  title,
  detail = null,
  artwork,
  albumIds,
  isRound = false,
  side = SIDE,
  standIn = MusicNote,
  onPress,
  onLongPress,
}: AMusicTileProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);

  return (
    <Button
      tone="bare"
      label={title}
      onPress={onPress}
      {...(onLongPress === undefined ? {} : { onLongPress })}
    >
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
          {albumIds !== undefined ? (
            <ACoverGrid albumIds={albumIds} standIn={standIn} iconSize={40} />
          ) : artwork === null || isMissing ? (
            <Icon of={standIn} size={40} colour={colours.textMuted} />
          ) : (
            <ARemotePicture
              style={styles.fills}
              uri={artwork}
              onMissing={() => {
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
