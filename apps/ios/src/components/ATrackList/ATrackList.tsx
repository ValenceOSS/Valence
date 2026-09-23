import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { ATrackRow } from '@ValencePhone/components/ATrackRow/ATrackRow';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { askAboutATrack } from '@ValencePhone/music/askAboutATrack';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { ATrackListProps } from './ATrackList.types';

/**
 * A list of tracks, any of which plays the list from there, as the web's track lists do: an
 * album's by their numbers, anything else by their covers.
 *
 * Playing from a track hands the whole list to the player, so the rest of it follows, and says
 * where it came from, so the player can show what it is playing from.
 *
 * @param tracks - The tracks.
 * @param source - Where they are from.
 * @param isOrdered - Whether their order matters, as a playlist somebody has ordered does.
 * @param isAnAlbum - Whether they are one album's, and so numbered rather than shown by cover.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist made from a track's menu, where there is somewhere to.
 * @param editing - What moving or taking out a track does, for a playlist of somebody's own.
 */
const ATrackList = ({
  tracks,
  source,
  isOrdered = false,
  isAnAlbum = false,
  onAlbum,
  onArtist,
  onPlaylist,
  editing,
}: ATrackListProps) => {
  const { player, state } = useTheMusic();
  const favourites = useFavourites(useWatchingProfile());
  const cache = useQueryClient();
  const mine = (useQuery(musicQueries.playlists()).data ?? []).filter(
    (playlist) => playlist.isMine,
  );

  return (
    <View>
      {tracks.map((track, at) => (
        <ATrackRow
          key={`${track.id}:${at.toString()}`}
          track={track}
          number={isAnAlbum ? (track.trackNumber ?? at + 1) : null}
          artwork={
            isAnAlbum || !track.album.hasArtwork
              ? null
              : onThisServer(albumArtworkUrl(track.album.id))
          }
          isCurrent={state.current?.id === track.id}
          isLiked={favourites.isKept(track.id)}
          onPlay={() => {
            player.play(tracks, at, { source, isOrdered });
          }}
          onMenu={() => {
            askAboutATrack({
              track,
              player,
              isLiked: favourites.isKept(track.id),
              onLike: () => {
                favourites.toggle(track.id);
              },
              onAlbum,
              onArtist,
              playlists: mine,
              onPlaylistsChanged: () => {
                void cache.invalidateQueries({ queryKey: musicQueries.key });
              },
              onPlaylist,
              inAPlaylist:
                editing === undefined
                  ? undefined
                  : {
                      canMoveUp: at > 0,
                      canMoveDown: at < tracks.length - 1,
                      onMoveUp: () => {
                        editing.onMove(at, at - 1);
                      },
                      onMoveDown: () => {
                        editing.onMove(at, at + 1);
                      },
                      onRemove: () => {
                        editing.onRemove(at);
                      },
                    },
            });
          }}
        />
      ))}
    </View>
  );
};

ATrackList.displayName = 'ATrackList';

export { ATrackList };
