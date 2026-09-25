import { Download } from '@keyline-icons/react-native';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { EPISODE_STILL } from '@ValenceMobile/components/AShow/components/EPISODE_STILL';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AMissingEpisodeProps } from './AMissingEpisode.types';

const styles = StyleSheet.create({
  facts: { flex: 1, gap: 4 },
  faded: { height: '100%', opacity: 0.4, position: 'absolute', width: '100%' },
  number: { alignItems: 'center', width: 24 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
});

/**
 * An episode the catalogue says exists and this library does not have, drawn in its place among the
 * ones it does, as the web draws it — so a gap is seen where it falls rather than found by counting.
 *
 * @param at - Which episode is missing.
 * @param title - What the catalogue calls it, where it says.
 * @param stillUrl - The catalogue's own still, where it has one.
 * @param airs - When it aired or airs, where the catalogue dates it.
 */
const AMissingEpisode = ({ at, title, stillUrl, airs }: AMissingEpisodeProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.number}>
        <Words size="small" tone="muted">
          {at}
        </Words>
      </View>

      <View
        style={[
          EPISODE_STILL,
          {
            backgroundColor: colours.surfaceRaised,
            borderColor: colours.border,
            borderStyle: 'dashed',
          },
        ]}
      >
        {stillUrl === null || isMissing ? null : (
          <Image
            style={styles.faded}
            source={{ uri: stillUrl }}
            onError={() => {
              setIsMissing(true);
            }}
            accessibilityIgnoresInvertColors
          />
        )}
        <Icon of={Download} size={20} colour={colours.textMuted} />
      </View>

      <View style={styles.facts}>
        <Words lines={1} tone="muted">
          {title ?? `Episode ${at.toString()}`}
        </Words>
        <Words size="small" tone="muted">
          {airs === '' ? 'Not in this library' : `Not in this library · ${airs}`}
        </Words>
      </View>
    </View>
  );
};

AMissingEpisode.displayName = 'AMissingEpisode';

export { AMissingEpisode };
