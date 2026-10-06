import { Sparkles } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { AMusicHead } from '@ValenceMobile/components/AMusicHead/AMusicHead';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { ATrackList } from '@ValenceMobile/components/ATrackList/ATrackList';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AMixProps } from './AMix.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One of the mixes Valence makes for a profile, as the liked songs are drawn: its cover of the
 * albums in it, what it is, made by Valence, and its songs to play in order or shuffled.
 *
 * @param mixId - Which mix.
 * @param onAlbum - Told to open an album.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist a song was added to.
 * @param onBack - Told to go back.
 */
const AMix = ({ mixId, onAlbum, onArtist, onPlaylist, onBack }: AMixProps) => {
  const colours = useTheColours();
  const read = useQuery(musicQueries.mix(mixId));
  const player = thePhonesMusicPlayer();
  const mix = read.data;
  const tracks = mix?.tracks ?? [];
  const covers = mix?.coverAlbumIds ?? [];
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

  if (mix === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <ANothingHere of={Sparkles} title={say('error.music.thereIsNoSuchMixToday')} />
      </Screen>
    );
  }

  const source = { kind: 'tracks' as const, id: mix.id, name: mix.title };

  return (
    <Screen scrolls onBack={onBack} behind={<AMoodBackground palette={lights} />}>
      <AMusicHead
        kind={say('common.mixByValence')}
        title={mix.title}
        detail={`${mix.detail} · ${sayCount('common.count.songs', tracks.length)}`}
        artwork={null}
        albumIds={covers}
        standIn={Sparkles}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source });
        }}
        onShuffle={() => {
          player.play(tracks, Math.floor(Math.random() * tracks.length), {
            source,
            isShuffled: true,
          });
        }}
      />

      <ATrackList
        tracks={tracks}
        source={source}
        onAlbum={onAlbum}
        onArtist={onArtist}
        {...(onPlaylist === undefined ? {} : { onPlaylist })}
      />
    </Screen>
  );
};

AMix.displayName = 'AMix';

export { AMix };
