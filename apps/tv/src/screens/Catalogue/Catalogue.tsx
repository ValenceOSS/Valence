import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { unwatchedByShow } from '@ValenceClient/library/unwatchedByShow';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { CatalogueProps } from './Catalogue.types';

const ACROSS = 6;

const RESTS_AFTER_MS = 600;

const TITLES = {
  films: 'tv.catalogue.films',
  shows: 'tv.catalogue.shows',
} as const satisfies Record<string, StringKey>;

/**
 * Every film, or every programme, as a wall of posters in alphabetical order, as the web's Films and
 * Shows pages have them.
 *
 * A programme is one poster however many episodes it has, and a film somebody is part-way through
 * says how far. The page is lit by its first poster once it arrives, and then by the poster the
 * remote rests on, once it has rested there a moment rather than at every step. The posters are sized so six fill the width of the screen between its margins.
 *
 * @param kind - Films or shows.
 * @param watchable - The libraries holding something to watch.
 * @param onOpen - Told which title was chosen.
 * @param onFeature - Told which title the remote has come to rest on, to light the page with it.
 * @param upTo - The tab this page belongs under, which pressing up from the top row goes to.
 */
const CataloguePage = ({ kind, watchable, onOpen, onFeature, upTo }: CatalogueProps) => {
  const resting = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resting.current !== null) {
        clearTimeout(resting.current);
      }
    },
    [],
  );

  const restOn = useCallback(
    (media: MediaSummary) => {
      if (resting.current !== null) {
        clearTimeout(resting.current);
      }

      resting.current = setTimeout(() => {
        onFeature(media);
      }, RESTS_AFTER_MS);
    },
    [onFeature],
  );
  const { progress } = useProgress();
  const everything = useQuery({
    ...libraryQueries.everything(watchable, { kind, order: 'title' }),
    enabled: watchable.length > 0,
  });

  const room = useRoomToFill();
  const screen = useWindowDimensions();
  const cardWidth = Math.floor(
    (screen.width - tokens.space.edge * 2 - tokens.space.md * (ACROSS - 1)) / ACROSS,
  );
  const upToBar = useHandOff('up', upTo);

  const items = useMemo(
    () => (kind === 'shows' ? collapseToShows(everything.data ?? []) : (everything.data ?? [])),
    [everything.data, kind],
  );
  const unwatched = useMemo(
    () =>
      kind === 'shows'
        ? unwatchedByShow(
            everything.data ?? [],
            (mediaId) => progress.get(mediaId)?.isFinished === true,
          )
        : null,
    [everything.data, kind, progress],
  );

  const first = items[0];
  const hasLit = useRef(false);

  useEffect(() => {
    if (first !== undefined && !hasLit.current) {
      hasLit.current = true;
      onFeature(first);
    }
  }, [first, onFeature]);

  if (everything.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>
          {kind === 'films' ? say('tv.catalogue.noFilms') : say('tv.catalogue.noShows')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      {room.height === null ? null : (
        <FlatList
          data={items}
          numColumns={ACROSS}
          keyExtractor={(media) => media.id}
          style={{ height: room.height }}
          contentContainerStyle={styles.inside}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.title}>{say(TITLES[kind])}</Text>}
          renderItem={({ item, index }) => {
            const watched = progress.get(item.id);

            return (
              <MediaCard
                media={item}
                {...(unwatched === null
                  ? {}
                  : {
                      unwatchedCount: unwatched.get(item.seriesId ?? item.seriesTitle ?? '') ?? 0,
                    })}
                shape="poster"
                width={cardWidth}
                onPress={onOpen}
                onFocus={() => {
                  restOn(item);

                  if (index < ACROSS) {
                    upToBar.arrive();
                  } else {
                    upToBar.leave();
                  }
                }}
                {...(watched === undefined || kind === 'shows'
                  ? {}
                  : { watchedFraction: watchedFraction(watched) })}
              />
            );
          }}
        />
      )}
    </View>
  );
};

const Catalogue = memo(CataloguePage);

Catalogue.displayName = 'Catalogue';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.xl,
    gap: tokens.space.lg,
  },
  row: { gap: tokens.space.md },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.title,
    fontWeight: '700',
    marginBottom: tokens.space.sm,
  },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { Catalogue };
