import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValencePhone/components/AMusicTile/AMusicTile';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { TheMusicProps } from './TheMusic.types';

const RECENT = 18;

const ARTISTS = 18;

/**
 * The music part of the library, as the web's music home lays it out: this profile's playlists,
 * with the songs they have liked first among them, what was added most recently, the artists, and
 * the playlists others have shared.
 *
 * @param header - What sits above it, which the library draws.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist.
 * @param onLiked - Told to open the songs this profile has liked.
 */
const TheMusic = ({ header, onAlbum, onArtist, onPlaylist, onLiked }: TheMusicProps) => {
  const colours = useTheColours();
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
            ? `${playlist.entryCount.toString()} songs`
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
    <Screen scrolls isSeeThrough>
      {header}

      {albums.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

      {!albums.isPending && recent.length === 0 && mine.length === 0 && shared.length === 0 ? (
        <Words tone="muted">
          Once a music library has been added and scanned, its albums and artists will be here.
        </Words>
      ) : null}

      <AShelf title="Your playlists">
        <AMusicTile
          title="Liked songs"
          detail={`${likedCount.toString()} ${likedCount === 1 ? 'song' : 'songs'}`}
          artwork={null}
          onPress={onLiked}
        />
        {mine.map(aPlaylist)}
      </AShelf>

      {recent.length === 0 ? null : (
        <AShelf title="Recently added">
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
        <AShelf title="Artists">
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
        <AShelf title="Shared with you">{shared.map(aPlaylist)}</AShelf>
      )}
    </Screen>
  );
};

TheMusic.displayName = 'TheMusic';

export { TheMusic };
