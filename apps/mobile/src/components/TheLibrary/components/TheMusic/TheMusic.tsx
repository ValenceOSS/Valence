import { Heart, ListMusic, MusicNote, Plus, User } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValenceMobile/components/AMusicTile/AMusicTile';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { AFilterChips } from '@ValenceMobile/components/AFilterChips/AFilterChips';
import { AQuickCard } from '@ValenceMobile/components/AQuickCard/AQuickCard';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { AnArrival } from '@ValenceMobile/components/AnArrival/AnArrival';
import { APlaylistDetails } from '@ValenceMobile/components/APlaylistDetails/APlaylistDetails';
import { useAskAboutAnAlbum } from '@ValenceMobile/music/useAskAboutAnAlbum';
import { coverAlbumsOf } from '@ValenceClient/music/coverAlbumsOf';
import { playlistArtworkUrl } from '@ValenceClient/music/fetchPlaylists';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { TheMusicProps } from './TheMusic.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const RECENT = 18;

const ARTISTS = 18;

const QUICK = 8;

const BIG = 168;

type Filter = 'all' | 'playlists' | 'albums' | 'artists';

const styles = StyleSheet.create({
  arriving: { gap: 24 },
  chips: { marginHorizontal: -SCREEN_EDGE },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickOne: { width: '48.8%' },
});

/**
 * The music part of the library, laid out as a music app's home is: a row of filters to narrow it
 * to playlists, albums or artists; at the top of everything, a grid of the few things to go straight
 * back to — the songs this profile has liked, its own playlists, the artists it follows and what was
 * added last — two to a row; and beneath, shelves of large artwork for what was added most recently,
 * the playlists, the artists and the playlists others have shared.
 *
 * @param header - What sits above it, which the library draws.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist.
 * @param onAllAlbums - Told somebody wants every album, not only the latest.
 * @param onAllArtists - Told somebody wants every artist, not only the first few.
 * @param onLiked - Told to open the songs this profile has liked.
 * @param onScrolled - Told whether it has been scrolled from its top.
 */
const TheMusic = ({
  header,
  onAlbum,
  onArtist,
  onPlaylist,
  onLiked,
  onAllAlbums,
  onAllArtists,
  onScrolled,
}: TheMusicProps) => {
  const askAboutAnAlbum = useAskAboutAnAlbum(onPlaylist);
  const colours = useTheColours();
  const cache = useQueryClient();
  const [isMaking, setIsMaking] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const albums = useQuery(musicQueries.albums('recent'));
  const artists = useQuery(musicQueries.artists());
  const playlists = useQuery(musicQueries.playlists());
  const liked = useQuery(musicQueries.liked());
  const mine = (playlists.data ?? []).filter((playlist) => playlist.isMine);
  const shared = (playlists.data ?? []).filter((playlist) => !playlist.isMine);
  const recent = albums.data ?? [];
  const likedCount = (liked.data ?? []).length;

  /**
   * One playlist on a shelf.
   *
   * @param playlist - The playlist.
   * @returns Its tile.
   */
  const aPlaylist = (playlist: PlaylistSummary) => {
    const ownCover = playlistArtworkUrl(playlist);

    return (
      <AMusicTile
        key={playlist.id}
        title={playlist.name}
        detail={
          playlist.isMine || playlist.owner === null
            ? sayCount('common.count.songs', playlist.entryCount)
            : playlist.owner.name
        }
        artwork={ownCover === null ? null : onThisServer(ownCover)}
        {...(ownCover === null ? { albumIds: playlist.artworkAlbumIds } : {})}
        onPress={() => {
          onPlaylist(playlist.id);
        }}
      />
    );
  };

  const followed = (artists.data ?? []).filter((artist) => artist.isFavourite);
  const quick = [
    <AQuickCard
      key="liked"
      title={say('common.likedSongs')}
      artwork={null}
      albumIds={coverAlbumsOf(liked.data ?? [])}
      standIn={Heart}
      onPress={onLiked}
    />,
    ...mine.map((playlist) => {
      const ownCover = playlistArtworkUrl(playlist);

      return (
        <AQuickCard
          key={`playlist-${playlist.id}`}
          title={playlist.name}
          artwork={ownCover === null ? null : onThisServer(ownCover)}
          {...(ownCover === null ? { albumIds: playlist.artworkAlbumIds } : {})}
          standIn={ListMusic}
          onPress={() => {
            onPlaylist(playlist.id);
          }}
        />
      );
    }),
    ...followed.map((artist) => (
      <AQuickCard
        key={`artist-${artist.id}`}
        title={artist.name}
        artwork={artist.hasImage ? onThisServer(artistImageUrl(artist.id)) : null}
        isRound
        standIn={User}
        onPress={() => {
          onArtist(artist.id);
        }}
      />
    )),
    ...recent.map((album) => (
      <AQuickCard
        key={`album-${album.id}`}
        title={album.title}
        artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
        standIn={MusicNote}
        onPress={() => {
          onAlbum(album.id);
        }}
        onLongPress={() => {
          askAboutAnAlbum(album);
        }}
      />
    )),
  ].slice(0, QUICK);
  const shows = (what: Filter) => filter === 'all' || filter === what;

  return (
    <Screen scrolls isSeeThrough {...(onScrolled === undefined ? {} : { onScrolled })}>
      {header}

      <AnArrival style={styles.arriving}>
        <View style={styles.chips}>
          <AFilterChips
            label={say('common.music')}
            chips={[
              { id: 'all', label: say('common.all') },
              { id: 'playlists', label: say('common.playlists') },
              { id: 'albums', label: say('common.albums') },
              { id: 'artists', label: say('common.artists') },
            ]}
            value={filter}
            onSelect={(chosen) => {
              setFilter(
                chosen === 'playlists' || chosen === 'albums' || chosen === 'artists'
                  ? chosen
                  : 'all',
              );
            }}
          />
        </View>

        {filter === 'all' && quick.length > 0 ? (
          <View style={styles.quick}>
            {quick.map((card) => (
              <View key={card.key} style={styles.quickOne}>
                {card}
              </View>
            ))}
          </View>
        ) : null}

        {albums.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

        {!albums.isPending && recent.length === 0 && mine.length === 0 && shared.length === 0 ? (
          <ANothingHere
            of={MusicNote}
            title={say('common.noMusicYet')}
            detail={say('common.onceAMusicLibraryHasBeen3')}
          />
        ) : null}

        {shows('playlists') ? (
          <AShelf title={say('common.yourPlaylists')}>
            <AMusicTile
              title={say('common.likedSongs')}
              detail={sayCount('common.count.songs', likedCount)}
              artwork={null}
              albumIds={coverAlbumsOf(liked.data ?? [])}
              onPress={onLiked}
            />
            {mine.map(aPlaylist)}
            <AMusicTile
              title={say('common.newPlaylist')}
              artwork={null}
              standIn={Plus}
              onPress={() => {
                setIsMaking(true);
              }}
            />
          </AShelf>
        ) : null}

        {recent.length === 0 || !shows('albums') ? null : (
          <AShelf title={say('common.recentlyAdded')} onSeeAll={onAllAlbums}>
            {recent.slice(0, RECENT).map((album) => (
              <AMusicTile
                key={album.id}
                side={BIG}
                title={album.title}
                detail={album.artist.name}
                artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
                onPress={() => {
                  onAlbum(album.id);
                }}
                onLongPress={() => {
                  askAboutAnAlbum(album);
                }}
              />
            ))}
          </AShelf>
        )}

        {(artists.data ?? []).length === 0 || !shows('artists') ? null : (
          <AShelf title={say('common.artists')} onSeeAll={onAllArtists}>
            {(artists.data ?? []).slice(0, ARTISTS).map((artist) => (
              <AMusicTile
                key={artist.id}
                title={artist.name}
                artwork={artist.hasImage ? onThisServer(artistImageUrl(artist.id)) : null}
                isRound
                onPress={() => {
                  onArtist(artist.id);
                }}
              />
            ))}
          </AShelf>
        )}

        {shared.length === 0 || !shows('playlists') ? null : (
          <AShelf title={say('common.sharedWithYou')}>{shared.map(aPlaylist)}</AShelf>
        )}

        <APlaylistDetails
          isOpen={isMaking}
          editing={null}
          onClose={() => {
            setIsMaking(false);
          }}
          onDone={(playlistId) => {
            setIsMaking(false);
            void cache.invalidateQueries({ queryKey: musicQueries.key });
            onPlaylist(playlistId);
          }}
        />
      </AnArrival>
    </Screen>
  );
};

TheMusic.displayName = 'TheMusic';

export { TheMusic };
