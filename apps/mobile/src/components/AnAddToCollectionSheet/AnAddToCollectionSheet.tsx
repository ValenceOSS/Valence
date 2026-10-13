import { Check, Plus } from '@keyline-icons/react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { addToCollection, createCollection } from '@ValenceClient/collections/fetchCollections';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import type { AnAddToCollectionSheetProps } from './AnAddToCollectionSheet.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const styles = StyleSheet.create({
  make: { gap: 10, paddingTop: 12 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  rowSaid: { flex: 1, gap: 2 },
  whole: { gap: 4 },
});

/**
 * Puts a film or programme into one of the household's collections, or into a new one named here,
 * as the web's dialog does: every collection listed, those it is in already marked and left alone,
 * and a tap on any other adding it at once and saying where it went.
 *
 * @param subject - The film or programme, or null while nothing is being added.
 * @param title - What it is called, to say where it went.
 * @param onClose - Closes it.
 */
const AnAddToCollectionSheet = ({ subject, title, onClose }: AnAddToCollectionSheetProps) => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const isOpen = subject !== null;
  const every = useQuery({ ...collectionQueries.all(true), enabled: isOpen });
  const holding = useQuery({
    ...collectionQueries.containing(subject ?? { mediaItemId: '' }),
    enabled: isOpen,
  });
  const [name, setName] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const already = new Set((holding.data ?? []).map((one) => one.id));

  const done = (said: string) => {
    void cache.invalidateQueries({ queryKey: collectionQueries.key });
    setName('');
    onClose();
    Alert.alert(said);
  };

  const addTo = (collectionId: string, collectionName: string) => {
    if (subject === null) {
      return;
    }

    setIsBusy(true);
    void addToCollection(collectionId, [subject])
      .then((isAdded) => {
        if (isAdded) {
          done(
            say('screens.addToCollectionDialog.titleIsNowInName', { title, name: collectionName }),
          );
        } else {
          Alert.alert(say('screens.addToCollectionDialog.thatCouldNotBeAdded'));
        }
      })
      .finally(() => {
        setIsBusy(false);
      });
  };

  const makeAndAdd = () => {
    if (subject === null || name.trim() === '') {
      return;
    }

    setIsBusy(true);
    void createCollection({ name: name.trim(), entries: [subject] })
      .then((made) => {
        if (made === null) {
          Alert.alert(say('screens.addToCollectionDialog.thatCouldNotBeAdded'));
        } else {
          done(say('screens.addToCollectionDialog.titleIsInANewCollection', { title }));
        }
      })
      .finally(() => {
        setIsBusy(false);
      });
  };

  return (
    <ASheet
      isOpen={isOpen}
      title={say('screens.addToCollectionDialog.addTitleToACollection', { title })}
      onClose={onClose}
    >
      <View style={styles.whole}>
        {every.isPending ? (
          <ASpinner colour={colours.textMuted} />
        ) : (every.data ?? []).length === 0 ? (
          <Words tone="muted">
            {say('screens.addToCollectionDialog.thereAreNoCollectionsYet')}
          </Words>
        ) : (
          (every.data ?? []).map((collection) => {
            const isIn = already.has(collection.id);

            return (
              <Button
                key={collection.id}
                tone="bare"
                isDisabled={isIn || isBusy}
                label={collection.name}
                onPress={() => {
                  addTo(collection.id, collection.name);
                }}
              >
                <View style={styles.row}>
                  <View style={styles.rowSaid}>
                    <Words isStrong>{collection.name}</Words>
                    {isIn ? (
                      <Words size="small" tone="muted">
                        {say('screens.addToCollectionDialog.alreadyInIt')}
                      </Words>
                    ) : null}
                  </View>
                  <Icon of={isIn ? Check : Plus} size={20} colour={colours.textMuted} />
                </View>
              </Button>
            );
          })
        )}

        <View style={styles.make}>
          <TextField
            label={say('common.newCollection')}
            placeholder={say('common.newCollection')}
            value={name}
            onValueChange={setName}
            onSubmit={makeAndAdd}
          />
          <Button isBusy={isBusy} isDisabled={name.trim() === ''} onPress={makeAndAdd}>
            {say('common.newCollection')}
          </Button>
        </View>
      </View>
    </ASheet>
  );
};

AnAddToCollectionSheet.displayName = 'AnAddToCollectionSheet';

export { AnAddToCollectionSheet };
