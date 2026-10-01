import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrowDownWideNarrow } from '@keyline-icons/react-native';
import { BrowseOrderSchema } from '@ValenceClient/library/BrowseOrder';
import { nameBrowseOrder } from '@ValenceClient/library/nameBrowseOrder';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { TheFiltersProps } from './TheFilters.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  group: { gap: 8 },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  opening: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  whole: { gap: 14 },
});

/**
 * The web's filters and order for a grid of films or programmes, each folded away behind a button
 * until somebody wants it: the filters behind Filters, and the order, with whether to leave out
 * what has been watched, behind a button that names the order chosen. Opening one folds the other
 * away.
 *
 * Each filter group takes one choice; pressing the chosen one again lets it go.
 *
 * @param groups - What can be filtered on, and by what.
 * @param selected - What is chosen.
 * @param onChange - Told what is chosen now.
 * @param onClear - Told to choose nothing.
 * @param arrangement - The order chosen, and whether what has been watched is left out.
 * @param onArrange - Told the arrangement chosen now.
 */
const TheFilters = ({
  groups,
  selected,
  onChange,
  onClear,
  arrangement,
  onArrange,
}: TheFiltersProps) => {
  const [open, setOpen] = useState<'filters' | 'order' | null>(null);
  const toggle = (which: 'filters' | 'order') => {
    setOpen((was) => (was === which ? null : which));
  };

  return (
    <View style={styles.whole}>
      <View style={styles.head}>
        <View style={styles.opening}>
          <Button
            tone="quiet"
            isChosen={open === 'filters'}
            onPress={() => {
              toggle('filters');
            }}
          >
            {selected.size === 0
              ? say('common.filters')
              : say('phone.theLibrary.theFilters.filtersSize', { size: selected.size.toString() })}
          </Button>

          <Button
            tone="quiet"
            icon={ArrowDownWideNarrow}
            isChosen={open === 'order'}
            label={[say('common.order'), nameBrowseOrder(arrangement.order)].join(', ')}
            onPress={() => {
              toggle('order');
            }}
          >
            {nameBrowseOrder(arrangement.order)}
          </Button>
        </View>

        {selected.size === 0 ? null : (
          <Button tone="quiet" onPress={onClear}>
            {say('common.clear')}
          </Button>
        )}
      </View>

      {open === 'order' ? (
        <>
          <SegmentedRow
            label={say('common.order')}
            items={BrowseOrderSchema.options.map((order) => ({
              id: order,
              label: nameBrowseOrder(order),
            }))}
            value={arrangement.order}
            onSelect={(id) => {
              const order = BrowseOrderSchema.safeParse(id);

              if (order.success) {
                onArrange({ ...arrangement, order: order.data });
              }
            }}
          />

          <View style={styles.switchRow}>
            <Words>{say('common.onlyWhatYouHaveNotWatched')}</Words>

            <Toggle
              label={say('common.onlyWhatYouHaveNotWatched')}
              isOn={arrangement.isHidingWatched}
              onToggle={(isHidingWatched) => {
                onArrange({ ...arrangement, isHidingWatched });
              }}
            />
          </View>
        </>
      ) : null}

      {open === 'filters'
        ? groups.map((group) => {
            const ids = new Set(group.options.map((option) => option.id));
            const chosen = [...selected].find((id) => ids.has(id)) ?? null;

            return (
              <View key={group.name} style={styles.group}>
                <Words size="small" tone="muted">
                  {group.name}
                </Words>

                <SegmentedRow
                  label={group.name}
                  items={group.options}
                  value={chosen}
                  onSelect={(id) => {
                    const rest = [...selected].filter((one) => !ids.has(one));

                    onChange(new Set(id === chosen ? rest : [...rest, id]));
                  }}
                />
              </View>
            );
          })
        : null}
    </View>
  );
};

TheFilters.displayName = 'TheFilters';

export { TheFilters };
