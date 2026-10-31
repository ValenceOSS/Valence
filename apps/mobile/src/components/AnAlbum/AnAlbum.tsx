import { ListPlus, Record, User } from '@keyline-icons/react-native';
import { useQuery } from '@tanstack/react-query';
import { useMyPlaylists } from '@ValenceClient/music/useMyPlaylists';

import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicHead } from '@ValenceMobile/components/AMusicHead/AMusicHead';
import { ARoundAction } from '@ValenceMobile/components/ARoundAction/ARoundAction';
import { AMusicScreen } from '@ValenceMobile/components/AMusicScreen/AMusicScreen';
import { ATrackList } from '@ValenceMobile/components/ATrackList/ATrackList';
import { ADownloadToListen } from '@ValenceMobile/components/ADownloadToListen/ADownloadToListen';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { APluginPanels } from '@ValenceMobile/components/APluginPanels/APluginPanels';
import { Words } from '@ValenceMobile/components/Words/Words';
import { howLongItRuns } from '@ValenceMobile/components/ATitle/howLongItRuns';
import { askWhichPlaylist } from '@ValenceMobile/music/askWhichPlaylist';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AnAlbumProps } from './AnAlbum.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

/**
 * One album, as the web's album page draws it: its cover, who it is by, when it came out and how
 * long it runs, a way to play it in order or shuffled or to add the whole of it to a playlist, and
 * its tracks by number, lit from behind in the colours of its cover as the player is.
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
  const playlists = useMyPlaylists();

  if (read.isPending) {
    return (
      <Screen centres onBack={onBack}>
        <ASpinner colour={colours.textMuted} />
      </Screen>
    );
  }

  if (read.data === undefined) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="danger">{say('phone.anAlbum.thatAlbumCouldNotBeRead')}</Words>
      </Screen>
    );
  }

  const { album, tracks } = read.data;
  const source = { kind: 'album' as const, id: album.id, name: album.title };
  const detail = [
    album.year === null ? null : album.year.toString(),
    sayCount('common.count.songs', album.trackCount),
    howLongItRuns(album.durationSeconds),
  ].filter((part) => part !== null);

  return (
    <AMusicScreen
      title={album.title}
      artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
      standIn={Record}
      onBack={onBack}
    >
      <AMusicHead
        kind={album.isCompilation ? say('common.compilation') : say('common.album')}
        detail={detail.join(' · ')}
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
      >
        <ARoundAction
          icon={User}
          says={say('common.artist')}
          onPress={() => {
            onArtist(album.artist.id);
          }}
        />
        {tracks.length === 0 ? null : (
          <ARoundAction
            icon={ListPlus}
            says={say('common.addToPlaylist')}
            onPress={() => {
              askWhichPlaylist(
                album.title,
                () => Promise.resolve(tracks.map((track) => track.id)),
                playlists.mine,
                playlists.changed,
                onPlaylist,
              );
            }}
          />
        )}
        {tracks.length === 0 ? null : (
          <ADownloadToListen
            isRound
            kind="album"
            id={album.id}
            title={album.title}
            tracks={tracks}
            toKeep={(quality) => ({ kind: 'album', detail: { album, tracks }, quality })}
          />
        )}
      </AMusicHead>

      <ATrackList
        tracks={tracks}
        source={source}
        isAnAlbum
        onAlbum={onAlbum}
        onArtist={onArtist}
        {...(onPlaylist === undefined ? {} : { onPlaylist })}
      />

      <APluginPanels on="album" subjectId={albumId} />
    </AMusicScreen>
  );
};

AnAlbum.displayName = 'AnAlbum';

export { AnAlbum };
