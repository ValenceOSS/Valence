import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { arrangeForBrowsing } from '@ValenceClient/library/arrangeForBrowsing';
import {
  readBrowseArrangement,
  saveBrowseArrangement,
} from '@ValenceClient/library/browseArrangementPreference';
import { unwatchedByShow } from '@ValenceClient/library/unwatchedByShow';
import { useLibraryFilters } from '@ValenceClient/library/useLibraryFilters';
import type { Arrangement } from '@ValenceClient/library/browseArrangementPreference';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { MediaCard } from '@ValenceTv/components/MediaCard/MediaCard';
import { ArrangementRow } from '@ValenceTv/screens/Catalogue/components/ArrangementRow/ArrangementRow';
import { FilterPanel } from '@ValenceTv/screens/Catalogue/components/FilterPanel/FilterPanel';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { CatalogueProps } from './Catalogue.types';
import { say } from '@ValenceI18n/say';

const ACROSS = 6;

const RESTS_AFTER_MS = 600;

const TITLES = { films: say('common.films'), shows: say('common.shows') } as const;

/**
 * Every film, or every programme, as a wall of posters in the order chosen above it, as the web's
 * Films and Shows pages have them.
 *
 * A programme is one poster however many episodes it has, and a film somebody is part-way through
 * says how far. The order, and whether what has been watched is left out, are remembered for each
 * page on this television. Genre, decade and rating filters, as the web's, narrow the wall from the
 * panel down the right, and say so where they leave nothing. The wall stays as it was while a new
 * filter is read, so the panel stays open and the remote stays where it was. The page is lit by its first poster
 * once it arrives, and then by the
 * poster the remote rests on, once it has rested there a moment rather than at every step. The
 * posters are sized so six fill the width of the screen between its margins.
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
  const [arrangement, setArrangement] = useState(() => readBrowseArrangement(kind));
  const arrange = useCallback(
    (next: Arrangement) => {
      setArrangement(next);
      saveBrowseArrangement(kind, next);
    },
    [kind],
  );
  const filters = useLibraryFilters();
  const [isFiltering, setIsFiltering] = useState(false);
  const isFiltered = filters.selected.size > 0;
  const everything = useQuery({
    ...libraryQueries.everything(watchable, { kind, ...filters.asked }),
    enabled: watchable.length > 0,
    placeholderData: keepPreviousData,
  });

  const room = useRoomToFill();
  const screen = useWindowDimensions();
  const cardWidth = Math.floor(
    (screen.width - tokens.space.edge * 2 - tokens.space.md * (ACROSS - 1)) / ACROSS,
  );
  const upToBar = useHandOff('up', upTo);

  const isFinished = useCallback(
    (mediaId: string) => progress.get(mediaId)?.isFinished === true,
    [progress],
  );
  const items = useMemo(
    () => arrangeForBrowsing(everything.data ?? [], { ...arrangement, isFinished }),
    [everything.data, arrangement, isFinished],
  );
  const unwatched = useMemo(
    () => (kind === 'shows' ? unwatchedByShow(everything.data ?? [], isFinished) : null),
    [everything.data, kind, isFinished],
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

  if ((everything.data ?? []).length === 0 && !isFiltered) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>
          {kind === 'films'
            ? say('tv.catalogue.thereAreNoFilmsHereYet')
            : say('tv.catalogue.thereAreNoShowsHereYet')}
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
          ListHeaderComponent={
            <>
              <Text style={styles.title}>{TITLES[kind]}</Text>

              <ArrangementRow
                arrangement={arrangement}
                onArrange={arrange}
                onFocus={upToBar.arrive}
                isFiltered={isFiltered}
                onFilters={() => {
                  setIsFiltering(true);
                }}
              />

              {items.length === 0 ? (
                <Text style={styles.empty}>
                  {(everything.data ?? []).length === 0
                    ? say('common.nothingMatchesThose')
                    : say('common.youHaveWatchedEverythingHere')}
                </Text>
              ) : null}
            </>
          }
          renderItem={({ item }) => {
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
                  upToBar.leave();
                }}
                {...(watched === undefined || kind === 'shows'
                  ? {}
                  : { watchedFraction: watchedFraction(watched) })}
              />
            );
          }}
        />
      )}

      {isFiltering ? (
        <FilterPanel
          groups={filters.groups}
          selected={filters.selected}
          onChange={filters.change}
          onClose={() => {
            setIsFiltering(false);
          }}
        />
      ) : null}
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
