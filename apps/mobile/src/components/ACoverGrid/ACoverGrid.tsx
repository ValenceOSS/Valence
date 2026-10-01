import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ACoverGridProps } from './ACoverGrid.types';

const styles = StyleSheet.create({
  fills: { height: '100%', width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', height: '100%', width: '100%' },
  quarter: { height: '50%', width: '50%' },
  standIn: { alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' },
});

/**
 * The cover of a list of songs, made of its albums' covers as the web makes a playlist's: four in
 * a grid once there are four, the first alone where there are fewer, and a stand-in where there
 * are none or the cover will not load. It fills whatever holds it.
 *
 * @param albumIds - The albums whose covers to use, in the order their songs come up.
 * @param standIn - What is drawn where there is no cover.
 * @param iconSize - How big the stand-in is.
 */
const ACoverGrid = ({ albumIds, standIn, iconSize }: ACoverGridProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);
  const tiles = albumIds.length >= 4 ? albumIds.slice(0, 4) : albumIds.slice(0, 1);

  if (tiles.length === 0 || isMissing) {
    return (
      <View style={styles.standIn}>
        <Icon of={standIn} size={iconSize} colour={colours.textMuted} />
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {tiles.map((albumId) => (
        <ARemotePicture
          key={albumId}
          style={tiles.length === 4 ? styles.quarter : styles.fills}
          uri={onThisServer(albumArtworkUrl(albumId))}
          onMissing={() => {
            setIsMissing(tiles.length === 1);
          }}
        />
      ))}
    </View>
  );
};

ACoverGrid.displayName = 'ACoverGrid';

export { ACoverGrid };
