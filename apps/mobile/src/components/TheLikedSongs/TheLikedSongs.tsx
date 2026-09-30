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
import { coverAlbumsOf } from '@ValenceClient/music/coverAlbumsOf';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { TheLikedSongsProps } from './TheLikedSongs.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SOURCE = { kind: 'liked' as const, id: null, name: say('common.likedSongs') };

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
  const covers = coverAlbumsOf(tracks);
  const lights = usePictureLights(
    covers[0] === undefined ? null : onThisServer(albumArtworkUrl(covers[0])),
  );

  if (read.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  return (
    <Screen scrolls onBack={onBack} behind={<AMoodBackground palette={lights} />}>
      <AMusicHead
        kind={say('common.playlist')}
        title={say('common.likedSongs')}
        detail={sayCount('common.count.songs', tracks.length)}
        artwork={null}
        albumIds={covers}
        standIn={Heart}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source: SOURCE });
        }}
        onShuffle={() => {
          player.play(tracks, Math.floor(Math.random() * tracks.length), {
            source: SOURCE,
            isShuffled: true,
          });
        }}
      />

      {tracks.length === 0 ? (
        <ANothingHere
          of={Heart}
          title={say('phone.theLikedSongs.noLikedSongsYet')}
          detail={say('phone.theLikedSongs.songsYouLikeWillBeHere')}
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
