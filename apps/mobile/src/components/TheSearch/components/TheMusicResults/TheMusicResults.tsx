import { SearchX } from '@keyline-icons/react-native';
import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValenceMobile/components/AMusicTile/AMusicTile';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { ATrackList } from '@ValenceMobile/components/ATrackList/ATrackList';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheMusicResultsProps } from './TheMusicResults.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SONGS_BESIDE_FILMS = 5;

const styles = StyleSheet.create({
  songs: { gap: 8 },
  whole: { gap: 20 },
});

/**
 * What the music libraries hold that matches a search, in the order the web's music search gives
 * it: the songs, then the artists, the albums and the playlists.
 *
 * Beside films and programmes only the first few songs are listed, since the rest of the page is
 * about those; searching music on its own lists them all, and says so where nothing matched.
 *
 * @param asked - What was searched for.
 * @param isOnItsOwn - Whether music is all that is being searched.
 * @param onAlbum - Told which album to open.
 * @param onArtist - Told which artist to open.
 * @param onPlaylist - Told which playlist to open.
 */
const TheMusicResultsSection = ({
  asked,
  isOnItsOwn,
  onAlbum,
  onArtist,
  onPlaylist,
}: TheMusicResultsProps) => {
  const colours = useTheColours();
  const found = useQuery(musicQueries.search(asked));
  const { tracks = [], albums = [], artists = [], playlists = [] } = found.data ?? {};
  const isEmpty =
    tracks.length === 0 && albums.length === 0 && artists.length === 0 && playlists.length === 0;

  if (found.isPending) {
    return isOnItsOwn ? <ActivityIndicator color={colours.textMuted} /> : null;
  }

  if (isEmpty) {
    return isOnItsOwn ? (
      <ANothingHere
        of={SearchX}
        title={say('common.nothingMatches', { query: asked })}
        detail={say('phone.theMusicResults.tryFewerWords')}
      />
    ) : null;
  }

  return (
    <View style={styles.whole}>
      {tracks.length === 0 ? null : (
        <View style={styles.songs}>
          <Words size="heading">{say('phone.theMusicResults.songs')}</Words>
          <ATrackList
            tracks={isOnItsOwn ? tracks : tracks.slice(0, SONGS_BESIDE_FILMS)}
            source={{
              kind: 'search',
              id: null,
              name: say('phone.theMusicResults.searchedFor', { query: asked }),
            }}
            onAlbum={onAlbum}
            onArtist={onArtist}
            onPlaylist={onPlaylist}
          />
        </View>
      )}

      {artists.length === 0 ? null : (
        <AShelf title={say('phone.theMusicResults.artists')}>
          {artists.map((artist) => (
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

      {albums.length === 0 ? null : (
        <AShelf title={say('phone.theMusicResults.albums')}>
          {albums.map((album) => (
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

      {playlists.length === 0 ? null : (
        <AShelf title={say('phone.theMusicResults.playlists')}>
          {playlists.map((playlist) => {
            const cover = playlist.artworkAlbumIds[0] ?? null;

            return (
              <AMusicTile
                key={playlist.id}
                title={playlist.name}
                detail={sayCount('phone.theMusicResults.songCount', playlist.entryCount)}
                artwork={cover === null ? null : onThisServer(albumArtworkUrl(cover))}
                onPress={() => {
                  onPlaylist(playlist.id);
                }}
              />
            );
          })}
        </AShelf>
      )}
    </View>
  );
};

const TheMusicResults = memo(TheMusicResultsSection);

TheMusicResults.displayName = 'TheMusicResults';

export { TheMusicResults };
