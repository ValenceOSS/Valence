import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { byLastWatched } from '@ValenceClient/playback/byLastWatched';
import { isWorthResuming, watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { Button } from '@ValencePhone/components/Button/Button';
import { CarryOn } from '@ValencePhone/components/TheLibrary/components/CarryOn/CarryOn';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheLibraryProps } from './TheLibrary.types';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const theFractionOf = (progress: WatchProgress | undefined): number =>
  progress === undefined ? 0 : watchedFraction(progress);

const AS_MANY_AS_A_ROW_HOLDS = 20;

const styles = StyleSheet.create({
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
});

/**
 * What is in this household's libraries.
 *
 * It opens on whatever somebody was part way through, drawn from every library rather than the one
 * showing, because they came back for a film and not for a tab.
 *
 * Which library is showing is held here rather than asked of the server, and the first one is
 * chosen as soon as the list arrives: a phone opening on a list of library names asks somebody to
 * make a choice before showing them anything, and the answer is almost always the first one.
 *
 * @param onLookAt - Told which title somebody wants to see more of.
 * @param onOut - Told once somebody has signed out.
 */
const TheLibrary = ({ onLookAt, onOut }: TheLibraryProps) => {
  const libraries = useQuery(libraryQueries.all());
  const watched = useQuery(viewingQueries.progress());
  const colours = useTheColours();
  const [chosen, setChosen] = useState<string | null>(null);
  const showing = chosen ?? libraries.data?.[0]?.id ?? null;
  const page = useQuery(libraryQueries.items(showing));
  const howFar = byMediaId(watched.data ?? []);
  const unfinished = (watched.data ?? []).filter(isWorthResuming).map((one) => one.mediaId);
  const carryingOn = useQuery({
    ...libraryQueries.across(
      (libraries.data ?? []).map((library) => library.id),
      { ids: unfinished, limit: AS_MANY_AS_A_ROW_HOLDS },
    ),
    enabled: unfinished.length > 0 && (libraries.data ?? []).length > 0,
  });

  return (
    <Screen scrolls>
      <Words size="title">Library</Words>

      {libraries.isError ? <Words tone="danger">Those could not be read.</Words> : null}

      <CarryOn
        items={[...(carryingOn.data ?? [])].sort(byLastWatched(howFar))}
        howFarThrough={(mediaId) => theFractionOf(howFar.get(mediaId))}
        onLookAt={onLookAt}
      />

      <SegmentedRow
        label="Library"
        items={(libraries.data ?? []).map((library) => ({ id: library.id, label: library.name }))}
        value={showing}
        onSelect={setChosen}
      />

      {page.isPending && showing !== null ? <ActivityIndicator color={colours.textMuted} /> : null}

      {page.data !== undefined && page.data.items.length === 0 ? (
        <Words tone="muted">Nothing in here yet.</Words>
      ) : null}

      <View style={styles.shelf}>
        {(page.data?.items ?? []).map((media) => (
          <Button
            key={media.id}
            tone="bare"
            label={media.title}
            onPress={() => {
              onLookAt(media.id);
            }}
          >
            <APoster media={media} watched={theFractionOf(howFar.get(media.id))} />
          </Button>
        ))}
      </View>

      <Button tone="quiet" onPress={onOut}>
        Sign out
      </Button>
    </Screen>
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
