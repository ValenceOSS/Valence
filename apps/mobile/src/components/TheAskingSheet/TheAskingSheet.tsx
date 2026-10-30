import { useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { theSheetsAsked } from '@ValenceMobile/platform/theSheetsAsked';

const styles = StyleSheet.create({
  quieter: { opacity: 0.45 },
  row: { justifyContent: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 11 },
  said: { paddingBottom: 12 },
  whole: { paddingBottom: 8 },
});

/**
 * Whatever the phone is asking somebody to choose between, in Valence's own sheet rising from the
 * foot rather than the system's: what it is about, a line more where there is one, and the choices
 * on a grouped card as the phone's own settings draw them, a row each — those that remove something
 * in red, those that cannot be picked dimmed. Drawn once at the root, so anything can ask without
 * drawing a sheet of its own. Putting it away answers with the choice that cancels, so there is no
 * cancel row to press.
 */
const TheAskingSheet = () => {
  const asking = theSheetsAsked();
  const asked = useSyncExternalStore(asking.subscribe, asking.read, asking.read);
  const sheet = asked?.sheet ?? null;
  const [shown, setShown] = useState(sheet);

  if (sheet !== null && sheet !== shown) {
    setShown(sheet);
  }

  return (
    <ASheet
      isOpen={sheet !== null}
      title={shown?.title ?? ''}
      onClose={() => {
        asking.answer(null);
      }}
    >
      {shown?.message === undefined ? null : (
        <View style={styles.said}>
          <Words tone="muted">{shown.message}</Words>
        </View>
      )}

      <View style={styles.whole}>
        <AGroup>
          {shown?.options.map((option, index) => {
            if (index === shown.cancelButtonIndex) {
              return [];
            }

            const isDisabled = shown.disabledButtonIndices?.includes(index) === true;

            return (
              <Button
                key={`${index.toString()}:${option}`}
                tone="bare"
                label={option}
                isDisabled={isDisabled}
                onPress={() => {
                  asking.answer(index);
                }}
              >
                <View style={[styles.row, isDisabled && styles.quieter]}>
                  <Words
                    {...(index === shown.destructiveButtonIndex ? { tone: 'danger' as const } : {})}
                  >
                    {option}
                  </Words>
                </View>
              </Button>
            );
          }) ?? []}
        </AGroup>
      </View>
    </ASheet>
  );
};

TheAskingSheet.displayName = 'TheAskingSheet';

export { TheAskingSheet };
