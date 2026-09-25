import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { say } from '@ValenceI18n/say';
import type { TheFiltersProps } from './TheFilters.types';

const styles = StyleSheet.create({
  group: { gap: 8 },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  whole: { gap: 14 },
});

/**
 * The web's filters for a grid of films or programmes — genre, decade, rating and your own rating —
 * folded away behind one button until somebody wants them.
 *
 * Each group takes one choice; pressing the chosen one again lets it go.
 *
 * @param groups - What can be filtered on, and by what.
 * @param selected - What is chosen.
 * @param onChange - Told what is chosen now.
 * @param onClear - Told to choose nothing.
 */
const TheFilters = ({ groups, selected, onChange, onClear }: TheFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.whole}>
      <View style={styles.head}>
        <Button
          tone="quiet"
          onPress={() => {
            setIsOpen((was) => !was);
          }}
        >
          {selected.size === 0
            ? say('phone.theFilters.filters')
            : say('phone.theFilters.filtersChosen', { count: selected.size.toString() })}
        </Button>

        {selected.size === 0 ? null : (
          <Button tone="quiet" onPress={onClear}>
            {say('phone.theFilters.clear')}
          </Button>
        )}
      </View>

      {isOpen
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
