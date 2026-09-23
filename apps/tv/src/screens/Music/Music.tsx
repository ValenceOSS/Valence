import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { MusicShelf } from '@ValenceTv/components/MusicShelf/MusicShelf';
import { MusicShortcut } from '@ValenceTv/components/MusicShortcut/MusicShortcut';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { LIKED_SONGS } from '@ValenceTv/music/LIKED_SONGS';
import { albumItem } from '@ValenceTv/music/albumItem';
import { artistItem } from '@ValenceTv/music/artistItem';
import { playlistItem } from '@ValenceTv/music/playlistItem';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MusicItem } from '@ValenceTv/music/MusicItem';
import type { MusicProps } from './Music.types';

const ACROSS = 4;

const SHORTCUTS = ACROSS * 2;

const RECENT = 18;

const RESTS_AFTER_MS = 400;

const HERO = 250;

/**
 * The front of the music section, laid out as the television's music apps lay theirs out: the name
 * of whatever the remote is on, large, over its picture, then a grid of ways straight back to what
 * is played most — liked songs, playlists, the newest albums — and beneath it shelves of what was
 * added lately, the artists there are and every playlist.
 *
 * The page is lit by the picture of whatever the remote rests on, once it has rested there a moment
 * rather than at every step.
 *
 * @param onOpen - Told which album, artist or playlist was chosen.
 * @param onFeature - Told which picture lights the page.
 * @param upTo - The tab this page belongs under, which pressing up from the grid goes to.
 */
const MusicPage = ({ onOpen, onFeature, upTo }: MusicProps) => {
  const albums = useQuery(musicQueries.albums('recent'));
  const artists = useQuery(musicQueries.artists());
  const playlists = useQuery(musicQueries.playlists());
  const screen = useWindowDimensions();
  const room = useRoomToFill();
  const upToBar = useHandOff('up', upTo);
  const [featured, setFeatured] = useState<MusicItem | null>(null);
  const resting = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recent = useMemo(() => (albums.data ?? []).slice(0, RECENT).map(albumItem), [albums.data]);
  const everyArtist = useMemo(() => (artists.data ?? []).map(artistItem), [artists.data]);
  const everyPlaylist = useMemo(() => (playlists.data ?? []).map(playlistItem), [playlists.data]);

  const shortcuts = useMemo(
    () => [LIKED_SONGS, ...everyPlaylist, ...recent].slice(0, SHORTCUTS),
    [everyPlaylist, recent],
  );

  const shown = featured ?? recent[0] ?? null;

  useEffect(
    () => () => {
      if (resting.current !== null) {
        clearTimeout(resting.current);
      }
    },
    [],
  );

  useEffect(() => {
    onFeature(shown?.art ?? null);
  }, [shown?.art, onFeature]);

  const restOn = useCallback((item: MusicItem) => {
    if (resting.current !== null) {
      clearTimeout(resting.current);
    }

    resting.current = setTimeout(() => {
      setFeatured(item);
    }, RESTS_AFTER_MS);
  }, []);

  const restOnShelf = useCallback(
    (item: MusicItem) => {
      upToBar.leave();
      restOn(item);
    },
    [restOn, upToBar],
  );

  const width = Math.floor(
    (screen.width - tokens.space.edge * 2 - tokens.space.md * (ACROSS - 1)) / ACROSS,
  );

  if (albums.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (recent.length === 0 && everyPlaylist.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>There is no music here yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      <View style={styles.hero}>
        <Text numberOfLines={1} style={styles.name}>
          {shown?.title ?? 'Music'}
        </Text>
        {shown === null ? null : <Text style={styles.detail}>{shown.detail}</Text>}
      </View>

      {room.height === null ? null : (
        <ScrollView
          style={{ height: room.height - HERO }}
          contentContainerStyle={styles.inside}
          showsVerticalScrollIndicator={false}
        >
          <TVFocusGuideView autoFocus style={styles.grid}>
            {shortcuts.map((item, at) => (
              <MusicShortcut
                key={`${item.kind}:${item.id}`}
                item={item}
                width={width}
                hasPreferredFocus={at === 0}
                onPress={onOpen}
                onFocus={(on) => {
                  restOn(on);

                  if (at < ACROSS) {
                    upToBar.arrive();
                  } else {
                    upToBar.leave();
                  }
                }}
              />
            ))}
          </TVFocusGuideView>

          {recent.length === 0 ? null : (
            <MusicShelf
              title="Recently added"
              items={recent}
              onOpen={onOpen}
              onFocus={restOnShelf}
            />
          )}

          {everyArtist.length === 0 ? null : (
            <MusicShelf title="Artists" items={everyArtist} onOpen={onOpen} onFocus={restOnShelf} />
          )}

          {everyPlaylist.length === 0 ? null : (
            <MusicShelf
              title="Playlists"
              items={[LIKED_SONGS, ...everyPlaylist]}
              onOpen={onOpen}
              onFocus={restOnShelf}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const Music = memo(MusicPage);

Music.displayName = 'Music';

const styles = StyleSheet.create({
  page: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
  hero: {
    height: HERO,
    justifyContent: 'flex-end',
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.lg,
    gap: tokens.space.xs,
  },
  name: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '800',
    maxWidth: 1300,
  },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.body },
  inside: { paddingBottom: tokens.space.xl, gap: tokens.space.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.edge,
    paddingTop: tokens.space.sm,
  },
});

export { Music };
