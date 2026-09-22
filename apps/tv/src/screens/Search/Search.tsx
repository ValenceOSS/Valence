import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { SystemSearch } from '@ValenceTv/components/SystemSearch/SystemSearch';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SearchProps } from './Search.types';

const SETTLES_AFTER_MS = 300;

const AT_MOST = 60;

const ACROSS = 6;

/**
 * Search, as the television searches everywhere else: its own keyboard along the top, and beneath
 * it every film and programme whose name matches, a programme once however many episodes match.
 *
 * The server is asked once the typing pauses rather than at every letter, and the answers already
 * shown stay while the next ones are read, so the grid does not blink empty between letters.
 *
 * @param watchable - The libraries holding something to watch.
 * @param onOpen - Told which title was chosen.
 * @param upTo - Where pressing up from the keyboard goes: the bar along the top.
 */
const Search = ({ watchable, onOpen, upTo }: SearchProps) => {
  const [typed, setTyped] = useState('');
  const [room, setRoom] = useState<{ width: number; height: number } | null>(null);
  const asked = useSettled(typed.trim(), SETTLES_AFTER_MS);

  const found = useQuery({
    ...libraryQueries.across(watchable, { search: asked, limit: AT_MOST }),
    enabled: watchable.length > 0 && asked !== '',
    placeholderData: (previous) => previous,
  });

  const items = useMemo(() => collapseToShows(found.data ?? []), [found.data]);

  return (
    <SystemSearch
      placeholder="Films and shows"
      onChangeText={setTyped}
      onResultsLayout={setRoom}
      upTo={upTo}
    >
      {room === null ? null : (
        <View style={{ width: room.width, height: room.height }}>
          {asked === '' ? null : found.isPending ? (
            <View style={styles.middle}>
              <ActivityIndicator size="large" color={tokens.colours.text} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.middle}>
              <Text style={styles.nothing}>Nothing called “{asked}” here.</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              numColumns={ACROSS}
              keyExtractor={(media) => media.id}
              style={{ height: room.height }}
              contentContainerStyle={styles.inside}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <MediaCard media={item} shape="poster" onPress={onOpen} />}
            />
          )}
        </View>
      )}
    </SystemSearch>
  );
};

Search.displayName = 'Search';

const styles = StyleSheet.create({
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nothing: { color: tokens.colours.muted, fontSize: tokens.type.body },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.lg,
    gap: tokens.space.lg,
  },
  row: { gap: tokens.space.md },
});

export { Search };
