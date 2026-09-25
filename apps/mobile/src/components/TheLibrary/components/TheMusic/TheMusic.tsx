import { MusicNote, Plus } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValenceMobile/components/AMusicTile/AMusicTile';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { AnArrival } from '@ValenceMobile/components/AnArrival/AnArrival';
import { APlaylistDetails } from '@ValenceMobile/components/APlaylistDetails/APlaylistDetails';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { TheMusicProps } from './TheMusic.types';

const RECENT = 18;

const ARTISTS = 18;

const styles = StyleSheet.create({
  arriving: { gap: 20 },
});

/**
 * The music part of the library, as the web's music home lays it out: this profile's playlists,
 * with the songs they have liked first among them, what was added most recently, the artists, and
 * the playlists others have shared.
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
  const colours = useTheColours();
  const cache = useQueryClient();
  const [isMaking, setIsMaking] = useState(false);
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
    const cover = playlist.artworkAlbumIds[0] ?? null;

    return (
      <AMusicTile
        key={playlist.id}
        title={playlist.name}
        detail={
          playlist.isMine || playlist.owner === null
            ? sayCount('phone.theMusic.songCount', playlist.entryCount)
            : playlist.owner.name
        }
        artwork={cover === null ? null : onThisServer(albumArtworkUrl(cover))}
        onPress={() => {
          onPlaylist(playlist.id);
        }}
      />
    );
  };

  return (
    <Screen scrolls isSeeThrough {...(onScrolled === undefined ? {} : { onScrolled })}>
      {header}

      <AnArrival style={styles.arriving}>
        {albums.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

        {!albums.isPending && recent.length === 0 && mine.length === 0 && shared.length === 0 ? (
          <ANothingHere
            of={MusicNote}
            title={say('phone.theMusic.emptyTitle')}
            detail={say('phone.theMusic.emptyDetail')}
          />
        ) : null}

        <AShelf title={say('phone.theMusic.yourPlaylists')}>
          <AMusicTile
            title={say('phone.theMusic.likedSongs')}
            detail={sayCount('phone.theMusic.songCount', likedCount)}
            artwork={null}
            onPress={onLiked}
          />
          {mine.map(aPlaylist)}
          <AMusicTile
            title={say('phone.theMusic.newPlaylist')}
            artwork={null}
            standIn={Plus}
            onPress={() => {
              setIsMaking(true);
            }}
          />
        </AShelf>

        {recent.length === 0 ? null : (
          <AShelf title={say('phone.theMusic.recentlyAdded')} onSeeAll={onAllAlbums}>
            {recent.slice(0, RECENT).map((album) => (
              <AMusicTile
                key={album.id}
                title={album.title}
                detail={album.artist.name}
                artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
                onPress={() => {
                  onAlbum(album.id);
                }}
              />
            ))}
          </AShelf>
        )}

        {(artists.data ?? []).length === 0 ? null : (
          <AShelf title={say('phone.theMusic.artists')} onSeeAll={onAllArtists}>
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

        {shared.length === 0 ? null : (
          <AShelf title={say('phone.theMusic.sharedWithYou')}>{shared.map(aPlaylist)}</AShelf>
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
