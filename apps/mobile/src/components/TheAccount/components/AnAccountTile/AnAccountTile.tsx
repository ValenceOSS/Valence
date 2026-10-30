import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnAccountTileProps } from './AnAccountTile.types';

const styles = StyleSheet.create({
  figure: { fontFamily: FONTS.sans.bold, fontSize: 28, fontVariant: ['tabular-nums'] },
  waiting: { alignItems: 'center', height: 36, justifyContent: 'center' },
  whole: { alignItems: 'center', gap: 4, paddingVertical: 16 },
});

/**
 * One of somebody's own things at the top of their account — downloads, requests, the inbox — as a
 * column of a shared card: a quiet icon, how many there are set large, and what they are beneath.
 * Pressing it opens them.
 *
 * @param icon - What it is drawn as.
 * @param says - What it opens.
 * @param figure - How many there are, or nothing while that is still being read, when a spinner
 *   stands in its place.
 * @param onPress - Told it was pressed.
 */
const AnAccountTile = ({ icon, says, figure, onPress }: AnAccountTileProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={says} onPress={onPress}>
      <View style={styles.whole}>
        <Icon of={icon} size={20} colour={colours.textMuted} />
        {figure === null ? (
          <View style={styles.waiting}>
            <ASpinner colour={colours.textMuted} size={22} />
          </View>
        ) : (
          <Text style={[styles.figure, { color: colours.text }]}>{figure.toString()}</Text>
        )}
        <Words size="small" tone="muted" lines={1}>
          {says}
        </Words>
      </View>
    </Button>
  );
};

AnAccountTile.displayName = 'AnAccountTile';

export { AnAccountTile };
