import { Record } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { AMusicHead } from '@ValenceMobile/components/AMusicHead/AMusicHead';
import { ATrackList } from '@ValenceMobile/components/ATrackList/ATrackList';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnAlbumProps } from './AnAlbum.types';

/**
 * One album, as the web's album page draws it: its cover, who it is by, when it came out and how
 * long it runs, a way to play it in order or shuffled, and its tracks by number, lit from behind in
 * the colours of its cover as the player is.
 *
 * @param albumId - Which album.
 * @param onAlbum - Told to open another album, from a track's menu.
 * @param onArtist - Told to open an artist.
 * @param onPlaylist - Told to open a playlist made from a track's menu.
 * @param onBack - Told somebody is done with it.
 */
const AnAlbum = ({ albumId, onAlbum, onArtist, onPlaylist, onBack }: AnAlbumProps) => {
  const colours = useTheColours();
  const read = useQuery(musicQueries.album(albumId));
  const player = thePhonesMusicPlayer();
  const lights = usePictureLights(
    read.data?.album.hasArtwork === true ? onThisServer(albumArtworkUrl(read.data.album.id)) : null,
  );

  if (read.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  if (read.data === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">That album could not be read.</Words>
      </Screen>
    );
  }

  const { album, tracks } = read.data;
  const source = { kind: 'album' as const, id: album.id, name: album.title };
  const detail = [
    album.year === null ? null : album.year.toString(),
    `${album.trackCount.toString()} ${album.trackCount === 1 ? 'song' : 'songs'}`,
    howLongItRuns(album.durationSeconds),
  ].filter((part) => part !== null);

  return (
    <Screen scrolls onBack={onBack} behind={<AMoodBackground palette={lights} />}>
      <AMusicHead
        kind={album.isCompilation ? 'Compilation' : 'Album'}
        title={album.title}
        detail={detail.join(' · ')}
        artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
        standIn={Record}
        canPlay={tracks.length > 0}
        onPlay={() => {
          player.play(tracks, 0, { source, isOrdered: true });
        }}
        onShuffle={() => {
          player.play(tracks, 0, { source, isShuffled: true });
        }}
      >
        <Button
          tone="ghost"
          onPress={() => {
            onArtist(album.artist.id);
          }}
        >
          {album.artist.name}
        </Button>
      </AMusicHead>

      <ATrackList
        tracks={tracks}
        source={source}
        isAnAlbum
        onAlbum={onAlbum}
        onArtist={onArtist}
        {...(onPlaylist === undefined ? {} : { onPlaylist })}
      />
    </Screen>
  );
};

AnAlbum.displayName = 'AnAlbum';

export { AnAlbum };
