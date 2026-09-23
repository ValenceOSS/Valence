import { Heart } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicHead } from '@ValencePhone/components/AMusicHead/AMusicHead';
import { ATrackList } from '@ValencePhone/components/ATrackList/ATrackList';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import type { TheLikedSongsProps } from './TheLikedSongs.types';

const SOURCE = { kind: 'liked' as const, id: null, name: 'Liked songs' };

/**
 * Every song this profile has liked, newest first, as the web's liked songs page draws them, with a
 * way to play them all or shuffled.
 *
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist made from a track's menu.
 * @param onBack - Told somebody is done with them.
 */
const TheLikedSongs = ({ onAlbum, onArtist, onPlaylist, onBack }: TheLikedSongsProps) => {
  const colours = useTheColours();
  const read = useQuery(musicQueries.liked());
  const { player } = useTheMusic();
  const tracks = read.data ?? [];

  if (read.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  return (
    <Screen scrolls onBack={onBack}>
      <AMusicHead
        kind="Playlist"
        title="Liked songs"
        detail={`${tracks.length.toString()} ${tracks.length === 1 ? 'song' : 'songs'}`}
        artwork={null}
        standIn={Heart}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source: SOURCE });
        }}
        onShuffle={() => {
          player.play(tracks, 0, { source: SOURCE, isShuffled: true });
        }}
      />

      {tracks.length === 0 ? (
        <ANothingHere
          of={Heart}
          title="No liked songs yet"
          detail="Songs you like will be here. Like one from its menu."
        />
      ) : (
        <ATrackList
          tracks={tracks}
          source={SOURCE}
          onAlbum={onAlbum}
          onArtist={onArtist}
          {...(onPlaylist === undefined ? {} : { onPlaylist })}
        />
      )}
    </Screen>
  );
};

TheLikedSongs.displayName = 'TheLikedSongs';

export { TheLikedSongs };
