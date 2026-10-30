import { ChevronRight } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
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
  count: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  said: { flex: 1, gap: 1 },
});

/**
 * One row of the account page that opens a page of its own: an icon on a tinted square, what the page
 * is, a short line about it where there is one, how many things are waiting in it where any are,
 * and a chevron.
 *
 * @param icon - The page's icon.
 * @param says - What the page is called.
 * @param detail - A short line beneath the name.
 * @param tint - A colour of its own for the square, with the icon in white, as the phone's settings
 *   colour each of theirs; without one the square is a quiet wash of the text colour.
 * @param count - How many things are waiting in the page, drawn as a pill before the chevron.
 * @param onPress - Told to open the page.
 */
const AnAccountRow = ({ icon, says, detail, tint, count, onPress }: AnAccountRowProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={says} onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: tint ?? withAlpha(colours.text, 0.08) }]}>
          <Icon of={icon} colour={tint === undefined ? colours.text : '#ffffff'} size={17} />
        </View>

        <View style={styles.said}>
          <Words lines={1}>{says}</Words>
          {detail === undefined ? null : (
            <Words size="small" tone="muted" lines={1}>
              {detail}
            </Words>
          )}
        </View>

        {count === undefined || count === 0 ? null : (
          <View style={[styles.count, { backgroundColor: colours.danger }]}>
            <Words size="small" tone="onArtwork">
              {count.toString()}
            </Words>
          </View>
        )}

        <Icon of={ChevronRight} colour={colours.textMuted} size={18} />
      </View>
    </Button>
  );
};

AnAccountRow.displayName = 'AnAccountRow';

export { AnAccountRow };
