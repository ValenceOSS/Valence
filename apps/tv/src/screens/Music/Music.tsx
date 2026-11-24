import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheScreen } from '@ValenceTv/platform/useTheScreen';
import { useQuery } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { MusicShelf } from '@ValenceTv/components/MusicShelf/MusicShelf';
import { MusicShortcut } from '@ValenceTv/components/MusicShortcut/MusicShortcut';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { LIKED_SONGS } from '@ValenceTv/music/LIKED_SONGS';
import { albumItem } from '@ValenceTv/music/albumItem';
import { albumsYouMightLike } from '@ValenceTv/music/albumsYouMightLike';
import { artistItem } from '@ValenceTv/music/artistItem';
import { mixItem } from '@ValenceTv/music/mixItem';
import { playlistItem } from '@ValenceTv/music/playlistItem';
import { topArtistsOf } from '@ValenceTv/music/topArtistsOf';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MusicItem } from '@ValenceTv/music/MusicItem';
import type { MixKind } from '@ValenceContracts/schemas/MusicMix';
import type { MusicProps } from './Music.types';
import { say } from '@ValenceI18n/say';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { rowsRememberTheirPlace } from '@ValenceTv/focus/rowsRememberTheirPlace';

const ACROSS = 4;

const SHORTCUTS = ACROSS * 2;

const RECENT = 18;

const RESTS_AFTER_MS = 400;

const HERO = 250;

const FOR_THEM: ReadonlySet<MixKind> = new Set(['daily', 'onRepeat', 'rediscover']);

const NOTHING: readonly never[] = [];

type Shelf = { title: string; items: readonly MusicItem[] };

/**
 * Leaves out a second way to the same album, artist or playlist, keeping the first.
 *
 * @param items - What to sift.
 * @returns Each of them once.
 */
const eachOnce = (items: readonly MusicItem[]): MusicItem[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.kind}:${item.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

/**
 * The front of the music section, laid out as the television's music apps lay theirs out and as
 * the web and the phone fill theirs: the name of whatever the remote is on, large, over its
 * picture, then a grid of ways straight back to what is played most — liked songs, this profile's
 * playlists, the artists it follows, what it played lately and the newest albums — and beneath it
 * shelves of what Valence made for it today, stations built around the artists it plays, what it
 * played lately, its top artists, albums it might like, mixes of the genres and decades it has
 * plenty of, what was added lately, its playlists and those shared with it, and every artist.
 *
 * The page is lit by the picture of whatever the remote rests on, once it has rested there a moment
 * rather than at every step.
 *
 * @param onOpen - Told which album, artist, playlist or mix was chosen.
 * @param onFeature - Told which picture lights the page.
 * @param upTo - The tab this page belongs under, which pressing up from the grid goes to.
 */
const MusicPage = ({ onOpen, onFeature, upTo }: MusicProps) => {
  const albums = useQuery(musicQueries.albums('recent'));
  const played = useQuery(musicQueries.albums('played'));
  const artists = useQuery(musicQueries.artists());
  const playlists = useQuery(musicQueries.playlists());
  const mixes = useQuery(musicQueries.mixes());
  const watching = useQuery(profileQueries.watching());
  const screen = useTheScreen();
  const room = useRoomToFill();
  const upToBar = useHandOff('up', upTo);
  const [featured, setFeatured] = useState<MusicItem | null>(null);
  const resting = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recent = useMemo(() => (albums.data ?? []).slice(0, RECENT).map(albumItem), [albums.data]);
  const everyArtist = useMemo(() => (artists.data ?? []).map(artistItem), [artists.data]);

  const shelves = useMemo((): Shelf[] => {
    const heard = played.data ?? NOTHING;
    const everyAlbum = albums.data ?? NOTHING;
    const everyone = artists.data ?? NOTHING;
    const made = mixes.data ?? NOTHING;
    const name = watching.data?.name;
    const minePlaylists = (playlists.data ?? NOTHING).filter((playlist) => playlist.isMine);

    return [
      {
        title:
          name === undefined
            ? say('common.madeForYou')
            : say('screens.musicPage.musicHome.madeForName', { name }),
        items: made.filter((mix) => FOR_THEM.has(mix.kind)).map(mixItem),
      },
      {
        title: say('screens.musicPage.musicHome.recommendedStations'),
        items: made.filter((mix) => mix.kind === 'station').map(mixItem),
      },
      {
        title: say('screens.musicPage.musicHome.recents'),
        items: heard.slice(0, RECENT).map(albumItem),
      },
      {
        title: say('tv.music.yourTopArtists'),
        items: topArtistsOf(heard, everyone, RECENT).map(artistItem),
      },
      {
        title: say('tv.music.albumsYouMightLike'),
        items: albumsYouMightLike(everyAlbum, heard, everyone, RECENT).map(albumItem),
      },
      {
        title: say('screens.musicPage.musicHome.yourTopMixes'),
        items: made.filter((mix) => mix.kind === 'genre' || mix.kind === 'decade').map(mixItem),
      },
      { title: say('common.recentlyAdded'), items: recent },
      {
        title: say('common.yourPlaylists'),
        items: [LIKED_SONGS, ...minePlaylists.map(playlistItem)],
      },
      {
        title: say('common.sharedWithYou'),
        items: (playlists.data ?? NOTHING).filter((playlist) => !playlist.isMine).map(playlistItem),
      },
      { title: say('common.artists'), items: everyArtist },
    ].filter((shelf) => shelf.items.length > 0);
  }, [
    albums.data,
    artists.data,
    everyArtist,
    mixes.data,
    played.data,
    playlists.data,
    recent,
    watching.data?.name,
  ]);

  const shortcuts = useMemo(
    () =>
      eachOnce([
        LIKED_SONGS,
        ...(playlists.data ?? NOTHING).filter((playlist) => playlist.isMine).map(playlistItem),
        ...(artists.data ?? NOTHING).filter((artist) => artist.isFavourite).map(artistItem),
        ...(played.data ?? NOTHING).slice(0, SHORTCUTS).map(albumItem),
        ...recent,
      ]).slice(0, SHORTCUTS),
    [artists.data, played.data, playlists.data, recent],
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

  if (recent.length === 0 && (playlists.data ?? NOTHING).length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>{say('common.noMusicYet')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      <View style={styles.hero}>
        <Text numberOfLines={1} style={styles.name}>
          {shown?.title ?? say('common.music')}
        </Text>
        {shown === null ? null : <Text style={styles.detail}>{shown.detail}</Text>}
      </View>

      {room.height === null ? null : (
        <ScrollView
          style={{ height: room.height - HERO }}
          contentContainerStyle={styles.inside}
          showsVerticalScrollIndicator={false}
        >
          <FocusGuide isRemembering={rowsRememberTheirPlace} style={styles.grid}>
            {shortcuts.map((item, at) => (
              <MusicShortcut
                key={`${item.kind}:${item.id}`}
                item={item}
                width={width}
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
          </FocusGuide>

          {shelves.map((shelf) => (
            <MusicShelf
              key={shelf.title}
              title={shelf.title}
              items={shelf.items}
              onOpen={onOpen}
              onFocus={restOnShelf}
            />
          ))}
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
