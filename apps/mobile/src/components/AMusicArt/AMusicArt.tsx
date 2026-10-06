import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ACoverGrid } from '@ValenceMobile/components/ACoverGrid/ACoverGrid';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AMusicArtProps } from './AMusicArt.types';

const styles = StyleSheet.create({
  fills: { height: '100%', width: '100%' },
});

/**
 * The picture of something in the music library, filling whatever holds it: its own artwork, a
 * grid of the covers of the albums in it where it has none of its own, or its icon where it has
 * neither or the picture would not load.
 *
 * @param artwork - Its own picture, where it has one.
 * @param albumIds - The albums whose covers stand in for it, where it is a collection of songs.
 * @param standIn - The icon drawn where there is no picture.
 * @param iconSize - How large that icon is.
 */
const AMusicArt = ({ artwork, albumIds, standIn, iconSize }: AMusicArtProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);

  if (albumIds !== undefined) {
    return <ACoverGrid albumIds={albumIds} standIn={standIn} iconSize={iconSize} />;
  }

  if (artwork === null || isMissing) {
    return <Icon of={standIn} size={iconSize} colour={colours.textMuted} />;
  }

  return (
    <ARemotePicture
      style={styles.fills}
      uri={artwork}
      onMissing={() => {
        setIsMissing(true);
      }}
    />
  );
};

AMusicArt.displayName = 'AMusicArt';

export { AMusicArt };
