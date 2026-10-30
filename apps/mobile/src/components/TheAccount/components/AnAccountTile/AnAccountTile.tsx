import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnAccountTileProps } from './AnAccountTile.types';

const styles = StyleSheet.create({
  figure: { fontFamily: FONTS.sans.bold, fontSize: 28, fontVariant: ['tabular-nums'] },
  news: { borderRadius: 4, height: 8, width: 8 },
  top: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  whole: { alignItems: 'center', gap: 4, paddingVertical: 16 },
});

/**
 * One of somebody's own things at the top of their account — downloads, requests, the inbox — as a
 * column of a shared card: a quiet icon, how many there are set large, and what they are beneath;
 * a dot beside the number where some of them are news. Pressing it opens them.
 *
 * @param icon - What it is drawn as.
 * @param says - What it opens.
 * @param figure - How many there are.
 * @param isNews - Whether some of them have not been seen yet.
 * @param onPress - Told it was pressed.
 */
const AnAccountTile = ({ icon, says, figure, isNews = false, onPress }: AnAccountTileProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={says} onPress={onPress}>
      <View style={styles.whole}>
        <Icon of={icon} size={20} colour={colours.textMuted} />
        <View style={styles.top}>
          <Text style={[styles.figure, { color: colours.text }]}>{figure.toString()}</Text>
          {isNews ? <View style={[styles.news, { backgroundColor: colours.danger }]} /> : null}
        </View>
        <Words size="small" tone="muted" lines={1}>
          {says}
        </Words>
      </View>
    </Button>
  );
};

AnAccountTile.displayName = 'AnAccountTile';

export { AnAccountTile };
