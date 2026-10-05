import { ActionSheetIOS, Alert } from 'react-native';
import { searchAskable } from '@ValenceClient/requests/fetchAskable';
import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import type { PlaylistMissingSong } from '@ValenceContracts/schemas/Playlist';
import { say } from '@ValenceI18n/say';

const MOST_OFFERED = 6;

/**
 * Finds the album a playlist's missing song is on and requests the one chosen, as the web's dialog
 * for it does: the catalogue's albums for its artist and its album, or its title where the playlist
 * does not say the album, offered in a sheet with where each stands.
 *
 * @param song - The song.
 * @param onRequested - Told once an album was requested, so what shows requests can be read again.
 */
const requestTheAlbumOf = async (
  song: PlaylistMissingSong,
  onRequested: () => void,
): Promise<void> => {
  const found = (
    await searchAskable(`${song.artist} ${song.album ?? song.title}`, 'album').catch(() => [])
  )
    .filter((album) => album.standing.status !== 'library')
    .slice(0, MOST_OFFERED);

  if (found.length === 0) {
    Alert.alert(say('common.noAlbumWasFoundForIt'));

    return;
  }

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: say('common.requestItsAlbum'),
      message: say('common.titleByArtistIsNotInYourLibrary', {
        title: song.title,
        artist: song.artist,
      }),
      options: [
        ...found.map((album) =>
          [album.title, album.subtitle, describeStanding(album.standing)?.label ?? null]
            .filter((part) => part !== null)
            .join(' · '),
        ),
        say('common.cancel'),
      ],
      cancelButtonIndex: found.length,
    },
    (picked) => {
      const album = found[picked];

      if (album === undefined) {
        return;
      }

      void askForMedia({
        kind: 'album',
        musicBrainzId: album.id,
        seasons: null,
        isPickedByHand: false,
      }).then(({ value, refusal }) => {
        if (value === null) {
          Alert.alert(refusal?.message ?? say('common.thatCouldNotBeRequested'));

          return;
        }

        onRequested();
        Alert.alert(
          say('common.titleIsRequested', { title: album.title }),
          say('common.youCanFollowItUnderSearch'),
        );
      });
    },
  );
};

export { requestTheAlbumOf };
