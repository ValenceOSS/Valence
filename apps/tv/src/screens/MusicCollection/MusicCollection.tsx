import { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Play, Shuffle } from '@keyline-icons/react-native';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { Button } from '@ValenceTv/components/Button/Button';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';
import { MusicShelf } from '@ValenceTv/components/MusicShelf/MusicShelf';
import { TrackRow } from '@ValenceTv/components/TrackRow/TrackRow';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { useCollection } from './useCollection';
import type { MusicCollectionProps } from './MusicCollection.types';

const COVER = 360;

const KINDS = {
  album: 'tv.musicCollection.album',
  artist: 'tv.musicCollection.artist',
  playlist: 'tv.musicCollection.playlist',
  liked: 'tv.musicCollection.playlist',
} as const satisfies Record<string, StringKey>;

/**
 * An album, an artist, a playlist or somebody's liked songs, as the television's music apps show
 * one: its picture beside its name, what it is and how long it lasts, Play and Shuffle beneath, and
 * then every song on it. An artist's page plays their most liked songs, and ends with their albums.
 *
 * Choosing a song plays the list from there and opens what is playing; the page is lit by its own
 * picture.
 *
 * @param view - Which page it is.
 * @param onPlayed - Told once something has started playing, to show it.
 * @param onOpen - Told which of an artist's albums was chosen.
 * @param onLight - Told which picture lights the page.
 */
const MusicCollection = ({ view, onPlayed, onOpen, onLight }: MusicCollectionProps) => {
  const collection = useCollection(view);
  const { state, player } = useMusicPlayer(theMusicPlayer());
  const room = useRoomToFill();
  const art = collection?.item.art ?? null;

  useEffect(() => {
    onLight(art);
  }, [art, onLight]);

  const playFrom = useCallback(
    (at: number, isShuffled = false) => {
      if (collection === null || collection.tracks.length === 0) {
        return;
      }

      player.play(collection.tracks, at, {
        source: collection.source,
        isOrdered: collection.isOrdered,
        isShuffled,
      });
      onPlayed();
    },
    [collection, player, onPlayed],
  );

  if (collection === null) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <MusicCover kind={collection.item.kind} art={collection.item.art} size={COVER} isUrgent />

      <View style={styles.about}>
        <Text style={styles.kind}>{say(KINDS[view.kind])}</Text>
        <Text numberOfLines={2} style={styles.title}>
          {collection.item.title}
        </Text>
        {collection.by === null ? null : (
          <Text numberOfLines={1} style={styles.by}>
            {collection.by}
          </Text>
        )}
        <Text style={styles.facts}>{collection.facts}</Text>

        <View style={styles.actions}>
          <Button
            label={say('tv.musicCollection.play')}
            icon={Play}
            variant="primary"
            hasPreferredFocus
            isDisabled={collection.tracks.length === 0}
            onPress={() => {
              playFrom(0);
            }}
          />
          <Button
            label={say('tv.musicCollection.shuffle')}
            icon={Shuffle}
            variant="secondary"
            isDisabled={collection.tracks.length === 0 || collection.isOrdered}
            onPress={() => {
              playFrom(Math.floor(Math.random() * collection.tracks.length), true);
            }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <FadeIn>
      <View style={styles.page} onLayout={room.onLayout}>
        {room.height === null ? null : (
          <FlatList
            style={{ height: room.height }}
            data={collection.tracks}
            keyExtractor={(track, at) => `${track.id}:${at.toString()}`}
            contentContainerStyle={styles.inside}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={header}
            ListFooterComponent={
              collection.albums.length === 0 ? null : (
                <View style={styles.footer}>
                  <MusicShelf
                    title={say('tv.musicCollection.albums')}
                    items={collection.albums}
                    onOpen={onOpen}
                  />
                </View>
              )
            }
            renderItem={({ item, index }) => (
              <View style={styles.track}>
                <TrackRow
                  track={item}
                  place={index}
                  isCurrent={state.current?.id === item.id}
                  isPlaying={state.isPlaying}
                  showsAlbum={collection.showsAlbum}
                  onPress={playFrom}
                />
              </View>
            )}
          />
        )}
      </View>
    </FadeIn>
  );
};

MusicCollection.displayName = 'MusicCollection';

const styles = StyleSheet.create({
  page: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inside: { paddingTop: tokens.space.xl, paddingBottom: tokens.space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.space.xl,
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.lg,
  },
  about: { flex: 1, gap: tokens.space.xs },
  kind: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.hero, fontWeight: '800' },
  by: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  facts: { color: tokens.colours.muted, fontSize: tokens.type.small },
  actions: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.md },
  track: { paddingHorizontal: tokens.space.edge - tokens.space.md },
  footer: { marginTop: tokens.space.lg },
});

export { MusicCollection };
