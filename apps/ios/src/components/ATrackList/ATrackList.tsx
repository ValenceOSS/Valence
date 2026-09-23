import { View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
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
 */
const ATrackList = ({
  tracks,
  source,
  isOrdered = false,
  isAnAlbum = false,
  onAlbum,
  onArtist,
}: ATrackListProps) => {
  const { player, state } = useTheMusic();
  const favourites = useFavourites(useWatchingProfile());

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
            askAboutATrack(
              track,
              player,
              favourites.isKept(track.id),
              () => {
                favourites.toggle(track.id);
              },
              onAlbum,
              onArtist,
            );
          }}
        />
      ))}
    </View>
  );
};

ATrackList.displayName = 'ATrackList';

export { ATrackList };
