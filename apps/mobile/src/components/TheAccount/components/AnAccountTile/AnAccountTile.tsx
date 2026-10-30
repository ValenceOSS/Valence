import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnAccountTileProps } from './AnAccountTile.types';

const CHIP = 36;

const styles = StyleSheet.create({
  card: { borderRadius: 20, gap: 14, minHeight: 128, padding: 14 },
  chip: {
    alignItems: 'center',
    borderRadius: 11,
    height: CHIP,
    justifyContent: 'center',
    width: CHIP,
  },
  count: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  said: { gap: 2, marginTop: 'auto' },
  whole: { flex: 1 },
});

/**
 * One of the things of somebody's own kept at the top of their account — downloads, requests, the
 * inbox — as a solid card: its icon on a coloured square, its name, and a line saying how it stands,
 * with how many are waiting in its corner where any are.
 *
 * @param icon - Its icon.
 * @param tint - The colour of the square its icon sits on.
 * @param says - What it is called.
 * @param detail - How it stands, such as how many are kept or unread.
 * @param count - How many things in it are waiting, drawn as a pill in its corner.
 * @param onPress - Told to open it.
 */
const AnAccountTile = ({ icon, tint, says, detail, count, onPress }: AnAccountTileProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;

  return (
    <View style={styles.whole}>
      <Button tone="bare" label={says} onPress={onPress}>
        <View style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
          <View style={[styles.chip, { backgroundColor: tint }]}>
            <Icon of={icon} colour="#ffffff" size={19} />
          </View>

          {count === undefined || count === 0 ? null : (
            <View style={[styles.count, { backgroundColor: colours.danger }]}>
              <Words size="small" tone="onArtwork">
                {count.toString()}
              </Words>
            </View>
          )}

          <View style={styles.said}>
            <Words lines={1}>{says}</Words>
            <Words size="small" tone="muted" lines={2}>
              {detail}
            </Words>
          </View>
        </View>
      </Button>
    </View>
  );
};

AnAccountTile.displayName = 'AnAccountTile';

export { AnAccountTile };
