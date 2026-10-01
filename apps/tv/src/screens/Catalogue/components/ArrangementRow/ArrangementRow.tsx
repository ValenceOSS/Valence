import { StyleSheet, TVFocusGuideView, View } from 'react-native';
import { Check } from '@keyline-icons/react-native/fill';
import { BrowseOrderSchema } from '@ValenceClient/library/BrowseOrder';
import { nameBrowseOrder } from '@ValenceClient/library/nameBrowseOrder';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ArrangementRowProps } from './ArrangementRow.types';
import { say } from '@ValenceI18n/say';

/**
 * The web's order and its choice to leave out what has been watched, as a row of pills above a
 * wall of posters: one for each order, the chosen one white, and one that leaves out what has been
 * watched while it is on. It catches the remote across the whole width, so Up reaches it from any
 * poster on the top row.
 *
 * @param arrangement - The order chosen, and whether what has been watched is left out.
 * @param onArrange - Told the arrangement chosen now.
 * @param onFocus - Told when the remote lands on any of its pills.
 */
const ArrangementRow = ({ arrangement, onArrange, onFocus }: ArrangementRowProps) => (
  <TVFocusGuideView autoFocus style={styles.row}>
    <View style={styles.orders}>
      {BrowseOrderSchema.options.map((order) => (
        <Button
          key={order}
          label={nameBrowseOrder(order)}
          variant={arrangement.order === order ? 'primary' : 'soft'}
          size="md"
          isPill
          onFocus={onFocus}
          onPress={() => {
            onArrange({ ...arrangement, order });
          }}
        />
      ))}
    </View>

    <Button
      label={say('common.onlyWhatYouHaveNotWatched')}
      variant={arrangement.isHidingWatched ? 'primary' : 'soft'}
      size="md"
      isPill
      {...(arrangement.isHidingWatched ? { icon: Check } : {})}
      onFocus={onFocus}
      onPress={() => {
        onArrange({ ...arrangement, isHidingWatched: !arrangement.isHidingWatched });
      }}
    />
  </TVFocusGuideView>
);

ArrangementRow.displayName = 'ArrangementRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  orders: { flexDirection: 'row', gap: tokens.space.sm },
});

export { ArrangementRow };
