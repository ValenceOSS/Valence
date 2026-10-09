import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { ACard } from '@ValenceMobile/components/ACard/ACard';
import { GRID_GAP } from '@ValenceMobile/components/APosterGrid/GRID_GAP';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useGridCells } from '@ValenceMobile/hooks/useGridCells';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheResultsProps } from './TheResults.types';
import { say } from '@ValenceI18n/say';

const AS_MANY_AS_ARE_WORTH_SHOWING = 60;

const styles = StyleSheet.create({
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
});

/**
 * What the library holds under what somebody typed, a programme once however many of its episodes
 * match.
 *
 * @param asked - What they typed.
 * @param kind - Films or programmes only, or null for both.
 * @param libraryIds - Where to look.
 * @param howFarThrough - How much of each thing they have seen.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 */
const TheResultsSection = ({
  asked,
  kind,
  libraryIds,
  howFarThrough,
  onLookAt,
  onLookAtShow,
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

  if (found.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  const results = collapseToShows(found.data ?? []);

  if (results.length === 0) {
    return (
      <Words tone="muted">
        {say('phone.theSearch.theResults.nothingCalledAskedInTheLibrary', { asked })}
      </Words>
    );
  }

  return (
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
  );
};

const TheResults = memo(TheResultsSection);

TheResults.displayName = 'TheResults';

export { TheResults };
