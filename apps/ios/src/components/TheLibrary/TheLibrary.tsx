import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { useLibraryFilters } from '@ValenceClient/library/useLibraryFilters';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { APosterGrid } from '@ValencePhone/components/APosterGrid/APosterGrid';
import { Button } from '@ValencePhone/components/Button/Button';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { ACard } from '@ValencePhone/components/ACard/ACard';
import { TheMark } from '@ValencePhone/components/TheMark/TheMark';
import { TheFilters } from '@ValencePhone/components/TheLibrary/components/TheFilters/TheFilters';
import { TheHome } from '@ValencePhone/components/TheLibrary/components/TheHome/TheHome';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';
import type { TheLibraryProps } from './TheLibrary.types';

type Cell = { kind: 'media'; media: MediaSummary } | { kind: 'programme'; programme: ShowSummary };

const EVERY = 'every';

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  parts: { flex: 1 },
});

/**
 * What is in this household's libraries, laid out as the web's are: a home page of shelves, and
 * films and programmes each as a grid of their own.
 *
 * Films and programmes each take the web's filters, and where there is more than one library of a
 * kind, a choice of which. Only libraries a phone can play are offered: music and books wait for
 * players of their own.
 *
 * Programmes are read as the list of programmes while nothing is filtered, which is one request,
 * and as their episodes gathered into programmes once something is, since genre and year belong to
 * the episodes.
 *
 * @param onWatch - Told to play something, and from where.
 * @param onLookAt - Told which title somebody wants to see more of.
 * @param onLookAtShow - Told which programme, in which library.
 */
const TheLibrary = ({ onWatch, onLookAt, onLookAtShow }: TheLibraryProps) => {
  const colours = useTheColours();
  const libraries = useQuery(libraryQueries.all());
  const watched = useQuery(viewingQueries.progress());
  const filters = useLibraryFilters();
  const [part, setPart] = useState('home');
  const [chosen, setChosen] = useState(EVERY);
  const howFar = byMediaId(watched.data ?? []);
  const films = (libraries.data ?? []).filter((library) => library.kind === 'movies');
  const programmes = (libraries.data ?? []).filter((library) => library.kind === 'shows');
  const watchable = [...films, ...programmes].map((library) => library.id);
  const ofThisKind = part === 'films' ? films : part === 'shows' ? programmes : [];
  const reading = chosen === EVERY ? ofThisKind.map((library) => library.id) : [chosen];
  const isFiltered = filters.selected.size > 0;
  const parts = [
    { id: 'home', label: 'Home' },
    ...(films.length > 0 ? [{ id: 'films', label: 'Films' }] : []),
    ...(programmes.length > 0 ? [{ id: 'shows', label: 'Shows' }] : []),
  ];

  const everything = useQuery({
    ...libraryQueries.everything(reading, {
      kind: part === 'shows' ? 'shows' : 'films',
      ...filters.asked,
    }),
    enabled: reading.length > 0 && (part === 'films' || isFiltered),
  });
  const programmeLists = useQueries({
    queries: reading.map((libraryId) => ({
      ...libraryQueries.shows(libraryId),
      enabled: part === 'shows' && !isFiltered,
    })),
  });

  const cells: readonly Cell[] =
    part === 'home'
      ? []
      : part === 'shows' && !isFiltered
        ? programmeLists
            .flatMap((list) => list.data ?? [])
            .sort((left, right) => left.title.localeCompare(right.title))
            .map((programme) => ({ kind: 'programme', programme }))
        : (part === 'shows' ? collapseToShows(everything.data ?? []) : (everything.data ?? [])).map(
            (media) => ({ kind: 'media', media }),
          );
  const isWaiting =
    part === 'shows' && !isFiltered
      ? programmeLists.some((list) => list.isPending)
      : everything.isPending && everything.fetchStatus !== 'idle';

  const header = (
    <>
      <View style={styles.bar}>
        <TheMark />
        <View style={styles.parts}>
          <SegmentedRow
            label="What to show"
            items={parts}
            value={part}
            onSelect={(next) => {
              setPart(next);
              setChosen(EVERY);
              filters.clear();
            }}
          />
        </View>
      </View>

      {libraries.isError ? <Words tone="danger">Those could not be read.</Words> : null}

      {ofThisKind.length > 1 ? (
        <SegmentedRow
          label="Which library"
          items={[
            { id: EVERY, label: 'All' },
            ...ofThisKind.map((library) => ({ id: library.id, label: library.name })),
          ]}
          value={chosen}
          onSelect={setChosen}
        />
      ) : null}

      {part === 'home' ? null : (
        <TheFilters
          groups={filters.groups}
          selected={filters.selected}
          onChange={filters.change}
          onClear={filters.clear}
        />
      )}

      {isWaiting ? <ActivityIndicator color={colours.textMuted} /> : null}

      {part !== 'home' && !isWaiting && cells.length === 0 ? (
        <Words tone="muted">{isFiltered ? 'Nothing matches those.' : 'Nothing in here yet.'}</Words>
      ) : null}
    </>
  );

  if (part === 'home') {
    return (
      <TheHome
        header={header}
        watchable={watchable}
        onWatch={onWatch}
        onLookAt={onLookAt}
        onLookAtShow={onLookAtShow}
      />
    );
  }

  return (
    <APosterGrid
      header={header}
      items={cells}
      keyOf={(cell) => (cell.kind === 'media' ? cell.media.id : cell.programme.id)}
      drawn={(cell) => {
        if (cell.kind === 'programme') {
          return (
            <Button
              tone="bare"
              label={cell.programme.title}
              onPress={() => {
                onLookAtShow(cell.programme.libraryId, cell.programme.id);
              }}
            >
              <APoster
                title={cell.programme.title}
                year={cell.programme.year ?? null}
                artwork={onThisServer(`/api/media/${cell.programme.coverMediaId}/image/poster`)}
              />
            </Button>
          );
        }

        const known = howFar.get(cell.media.id);

        return (
          <ACard
            media={cell.media}
            asProgramme={part === 'shows'}
            watched={known === undefined ? 0 : watchedFraction(known)}
            onLookAt={onLookAt}
            onLookAtShow={onLookAtShow}
          />
        );
      }}
    />
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
