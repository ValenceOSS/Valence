import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheLibraryProps } from './TheLibrary.types';

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  tab: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

/**
 * What is in this household's libraries.
 *
 * Which library is showing is held here rather than asked of the server, and the first one is
 * chosen as soon as the list arrives: a phone opening on a list of library names asks somebody to
 * make a choice before showing them anything, and the answer is almost always the first one.
 *
 * @param onOut - Told once somebody has signed out.
 */
const TheLibrary = ({ onOut }: TheLibraryProps) => {
  const libraries = useQuery(libraryQueries.all());
  const colours = useTheColours();
  const [chosen, setChosen] = useState<string | null>(null);
  const showing = chosen ?? libraries.data?.[0]?.id ?? null;
  const page = useQuery(libraryQueries.items(showing));

  return (
    <Screen scrolls>
      <Words size="title">Library</Words>

      {libraries.isError ? <Words tone="danger">Those could not be read.</Words> : null}

      <View style={styles.tabs}>
        {(libraries.data ?? []).map((library) => (
          <Pressable
            key={library.id}
            accessibilityRole="button"
            accessibilityState={{ selected: library.id === showing }}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: library.id === showing ? colours.accent : colours.surfaceRaised,
                borderColor: library.id === showing ? colours.accent : colours.border,
              },
              pressed && styles.pressed,
            ]}
            onPress={() => {
              setChosen(library.id);
            }}
          >
            <Words size="small" tone={library.id === showing ? 'plain' : 'muted'}>
              {library.name}
            </Words>
          </Pressable>
        ))}
      </View>

      {page.isPending && showing !== null ? <ActivityIndicator color={colours.textMuted} /> : null}

      {page.data !== undefined && page.data.items.length === 0 ? (
        <Words tone="muted">Nothing in here yet.</Words>
      ) : null}

      <View style={styles.shelf}>
        {(page.data?.items ?? []).map((media) => (
          <APoster key={media.id} media={media} />
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
