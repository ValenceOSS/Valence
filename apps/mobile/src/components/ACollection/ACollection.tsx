import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Layers } from '@keyline-icons/react-native';
import { arrangeCollection } from '@ValenceClient/collections/arrangeCollection';
import { collectionCoverPath } from '@ValenceClient/collections/collectionCoverPath';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { CollectionOrderSchema } from '@ValenceContracts/schemas/Collection';
import type { CollectionOrder } from '@ValenceContracts/schemas/Collection';
import type { ACollectionProps } from './ACollection.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const COVER_WIDE = 132;

const ACROSS = 3;

const GAP = 12;

const A_FEW_LINES = 4;

const styles = StyleSheet.create({
  cover: {
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: 'hidden',
    width: COVER_WIDE,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  picture: { height: '100%', width: '100%' },
  top: { alignItems: 'center', gap: 10 },
});

/**
 * A collection's page on a phone: its cover, its name and what it gathers, and every film and
 * programme in it this viewer may see, as placed where its order matters and otherwise oldest
 * first, or by name. A collection is looked after from a browser; here it is only watched.
 *
 * @param collectionId - Which collection.
 * @param onLookAt - Told to open a film.
 * @param onLookAtShow - Told to open a programme.
 * @param onBack - Told somebody is done with it.
 */
const ACollection = ({ collectionId, onLookAt, onLookAtShow, onBack }: ACollectionProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const asked = useQuery(collectionQueries.one(collectionId));
  const [order, setOrder] = useState<CollectionOrder | null>(null);
  const [isAllOfIt, setIsAllOfIt] = useState(false);

  if (asked.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (asked.data === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <ANothingHere of={Layers} title={say('common.thisCollectionCouldNotBeRead')} />
      </Screen>
    );
  }

  const { collection, entries } = asked.data;
  const arrangement = order ?? (collection.isOrdered ? 'position' : 'year');
  const cover = collectionCoverPath(collection);
  const wide = (width - SCREEN_EDGE * 2 - GAP * (ACROSS - 1)) / ACROSS;
  const count = sayCount('common.count.titles', collection.entryCount);

  return (
    <Screen scrolls onBack={onBack}>
      <View style={styles.top}>
        <View style={[styles.cover, { backgroundColor: colours.surfaceRaised }]}>
          {cover === null ? null : (
            <ARemotePicture style={styles.picture} uri={onThisServer(cover)} />
          )}
        </View>

        <Words size="title" isCentred>
          {collection.name}
        </Words>

        <Words tone="muted">
          {collection.isOrdered ? say('common.countTitlesInOrder', { count }) : count}
        </Words>
      </View>

      {collection.description === null ? null : (
        <>
          <Words tone="muted" {...(isAllOfIt ? {} : { lines: A_FEW_LINES })}>
            {collection.description}
          </Words>

          {isAllOfIt ? null : (
            <Button
              tone="quiet"
              onPress={() => {
                setIsAllOfIt(true);
              }}
            >
              {say('common.more')}
            </Button>
          )}
        </>
      )}

      {entries.length === 0 ? (
        <ANothingHere of={Layers} title={say('common.nothingInThisCollectionYet')} />
      ) : (
        <>
          <SegmentedRow
            label={say('common.arrangeIt')}
            value={arrangement}
            items={[
              ...(collection.isOrdered
                ? [{ id: 'position', label: say('common.itsOwnOrder') }]
                : []),
              { id: 'year', label: say('common.byYear') },
              { id: 'title', label: say('common.byName') },
            ]}
            onSelect={(id) => {
              const chosen = CollectionOrderSchema.safeParse(id);

              if (chosen.success) {
                setOrder(chosen.data);
              }
            }}
          />

          <View style={styles.grid}>
            {arrangeCollection(entries, arrangement).map((entry) => (
              <ACard
                key={entry.id}
                media={entry.media}
                asProgramme={entry.kind === 'series'}
                wide={wide}
                onLookAt={onLookAt}
                onLookAtShow={onLookAtShow}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

ACollection.displayName = 'ACollection';

export { ACollection };
