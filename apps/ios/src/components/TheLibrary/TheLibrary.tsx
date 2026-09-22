import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import type { TheLibraryProps } from './TheLibrary.types';

const styles = StyleSheet.create({
  chosen: { backgroundColor: '#3a8ee8' },
  chosenName: { color: '#ffffff' },
  empty: { color: '#9aa0a6', fontSize: 14 },
  inside: { gap: 20, padding: 20, paddingTop: 72 },
  out: { color: '#3a8ee8', fontSize: 14, paddingTop: 8 },
  screen: { flex: 1, backgroundColor: '#0e0e0e' },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tab: { backgroundColor: '#1a1a1a', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  tabName: { color: '#f6fbf9', fontSize: 13 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { color: '#f6fbf9', fontSize: 28, fontWeight: '600' },
  trouble: { color: '#e8503a', fontSize: 14 },
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
  const [chosen, setChosen] = useState<string | null>(null);
  const showing = chosen ?? libraries.data?.[0]?.id ?? null;
  const page = useQuery(libraryQueries.items(showing));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.inside}>
      <Text style={styles.title}>Library</Text>

      {libraries.isError ? <Text style={styles.trouble}>Those could not be read.</Text> : null}

      <View style={styles.tabs}>
        {(libraries.data ?? []).map((library) => (
          <Pressable
            key={library.id}
            accessibilityRole="button"
            style={[styles.tab, library.id === showing && styles.chosen]}
            onPress={() => {
              setChosen(library.id);
            }}
          >
            <Text style={[styles.tabName, library.id === showing && styles.chosenName]}>
              {library.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {page.isPending && showing !== null ? <ActivityIndicator color="#f6fbf9" /> : null}

      {page.data !== undefined && page.data.items.length === 0 ? (
        <Text style={styles.empty}>Nothing in here yet.</Text>
      ) : null}

      <View style={styles.shelf}>
        {(page.data?.items ?? []).map((media) => (
          <APoster key={media.id} media={media} />
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={onOut}>
        <Text style={styles.out}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
};

TheLibrary.displayName = 'TheLibrary';

export { TheLibrary };
