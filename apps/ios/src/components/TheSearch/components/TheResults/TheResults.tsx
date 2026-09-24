import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { ACard } from '@ValencePhone/components/ACard/ACard';
import { ACatalogueCard } from '@ValencePhone/components/ACatalogueCard/ACatalogueCard';
import { GRID_GAP } from '@ValencePhone/components/APosterGrid/GRID_GAP';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { Words } from '@ValencePhone/components/Words/Words';
import { useGridCells } from '@ValencePhone/hooks/useGridCells';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheResultsProps } from './TheResults.types';

const AS_MANY_AS_ARE_WORTH_SHOWING = 60;

const styles = StyleSheet.create({
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
});

/**
 * What the library holds under what somebody typed, a programme once however many of its episodes
 * match, and — for somebody who may ask for things — the films and programmes of that name the
 * library does not have yet, to ask for.
 *
 * @param asked - What they typed.
 * @param kind - Films or programmes only, or null for both.
 * @param libraryIds - Where to look.
 * @param howFarThrough - How much of each thing they have seen.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param onAsk - Told to open something to ask for, or null for somebody who may not.
 */
const TheResultsSection = ({
  asked,
  kind,
  libraryIds,
  howFarThrough,
  onLookAt,
  onLookAtShow,
  onAsk,
}: TheResultsProps) => {
  const colours = useTheColours();
  const { cell } = useGridCells();
  const found = useQuery(
    libraryQueries.across(libraryIds, {
      search: asked,
      limit: AS_MANY_AS_ARE_WORTH_SHOWING,
      ...(kind === null ? {} : { kind }),
    }),
  );
  const films = useQuery(
    requestsQueries.askableSearch(asked, 'film', onAsk !== null && kind !== 'shows'),
  );
  const programmes = useQuery(
    requestsQueries.askableSearch(asked, 'series', onAsk !== null && kind !== 'films'),
  );
  const askable = [
    ...(kind === 'shows' ? [] : (films.data ?? [])),
    ...(kind === 'films' ? [] : (programmes.data ?? [])),
  ].filter((title) => title.standing.status !== 'library');

  if (found.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  const results = collapseToShows(found.data ?? []);

  return (
    <>
      {results.length === 0 ? (
        <Words tone="muted">{`Nothing called “${asked}” in the library.`}</Words>
      ) : (
        <View style={styles.shelf}>
          {results.map((media) => (
            <ACard
              key={media.id}
              media={media}
              asProgramme
              watched={howFarThrough(media.id)}
              wide={cell}
              onLookAt={onLookAt}
              onLookAtShow={onLookAtShow}
            />
          ))}
        </View>
      )}

      {onAsk === null || askable.length === 0 ? null : (
        <AShelf title="Not in your library yet">
          {askable.map((title) => (
            <ACatalogueCard key={`${title.kind}:${title.id}`} title={title} onAsk={onAsk} />
          ))}
        </AShelf>
      )}
    </>
  );
};

const TheResults = memo(TheResultsSection);

TheResults.displayName = 'TheResults';

export { TheResults };
