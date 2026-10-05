import { ChevronRight } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AnAccountRowProps } from './AnAccountRow.types';

const BADGE = 30;

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 8,
    height: BADGE,
    justifyContent: 'center',
    width: BADGE,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  said: { flex: 1, gap: 1 },
});

/**
 * One row of the account page that opens a page of its own: an icon on a tinted square, what the page
 * is, a short line about it where there is one, and a chevron.
 *
 * @param icon - The page's icon.
 * @param says - What the page is called.
 * @param detail - A short line beneath the name.
 * @param onPress - Told to open the page.
 */
const AnAccountRow = ({ icon, says, detail, onPress }: AnAccountRowProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={says} onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
          <Icon of={icon} colour={colours.text} size={17} />
        </View>

        <View style={styles.said}>
          <Words lines={1}>{says}</Words>
          {detail === undefined ? null : (
            <Words size="small" tone="muted" lines={1}>
              {detail}
            </Words>
          )}
        </View>

        <Icon of={ChevronRight} colour={colours.textMuted} size={18} />
      </View>
    </Button>
  );
};

AnAccountRow.displayName = 'AnAccountRow';

export { AnAccountRow };
