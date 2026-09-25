import { Heart } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicHead } from '@ValenceMobile/components/AMusicHead/AMusicHead';
import { ATrackList } from '@ValenceMobile/components/ATrackList/ATrackList';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { TheLikedSongsProps } from './TheLikedSongs.types';

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
  const player = thePhonesMusicPlayer();
  const tracks = read.data ?? [];
  const source = { kind: 'liked' as const, id: null, name: say('phone.theLikedSongs.title') };

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
        kind={say('phone.theLikedSongs.kind')}
        title={say('phone.theLikedSongs.title')}
        detail={sayCount('phone.theLikedSongs.songs', tracks.length)}
        artwork={null}
        standIn={Heart}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source });
        }}
        onShuffle={() => {
          player.play(tracks, 0, { source, isShuffled: true });
        }}
      />

      {tracks.length === 0 ? (
        <ANothingHere
          of={Heart}
          title={say('phone.theLikedSongs.emptyTitle')}
          detail={say('phone.theLikedSongs.emptyDetail')}
        />
      ) : (
        <ATrackList
          tracks={tracks}
          source={source}
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
