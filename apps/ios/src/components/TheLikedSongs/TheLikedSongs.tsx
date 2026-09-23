import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { Heart } from 'lucide-react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicHead } from '@ValencePhone/components/AMusicHead/AMusicHead';
import { ATrackList } from '@ValencePhone/components/ATrackList/ATrackList';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheLikedSongsProps } from './TheLikedSongs.types';

const SOURCE = { kind: 'liked' as const, id: null, name: 'Liked songs' };

/**
 * Every song this profile has liked, newest first, as the web's liked songs page draws them, with a
 * way to play them all or shuffled.
 *
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onBack - Told somebody is done with them.
 */
const TheLikedSongs = ({ onAlbum, onArtist, onBack }: TheLikedSongsProps) => {
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
        <Words tone="muted" isCentred>
          Songs you like will be here. Like one from its menu.
        </Words>
      ) : (
        <ATrackList tracks={tracks} source={SOURCE} onAlbum={onAlbum} onArtist={onArtist} />
      )}
    </Screen>
  );
};

TheLikedSongs.displayName = 'TheLikedSongs';

export { TheLikedSongs };
