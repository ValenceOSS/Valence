import { ActionSheetIOS, Alert } from 'react-native';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { say } from '@ValenceI18n/say';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

/**
 * Offers somebody's own playlists to put a track in, in the system's action sheet, as the web's
 * track menu does: a new one named after the track, which is then opened, or one they already have.
 *
 * @param track - The track.
 * @param playlists - Their own playlists.
 * @param onChanged - Told a playlist changed, so what shows them can read them again.
 * @param onPlaylist - Told to open the new playlist, where there is somewhere to open it.
 */
const askWhichPlaylist = (
  track: MusicTrack,
  playlists: readonly PlaylistSummary[],
  onChanged: () => void,
  onPlaylist: ((playlistId: string) => void) | undefined,
): void => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: say('phone.askWhichPlaylist.title'),
      options: [
        say('phone.askWhichPlaylist.newPlaylist'),
        ...playlists.map((playlist) => playlist.name),
        say('common.cancel'),
      ],
      cancelButtonIndex: playlists.length + 1,
    },
    (picked) => {
      if (picked === 0) {
        void createPlaylist({ name: track.title, mediaItemIds: [track.id] }).then((made) => {
          if (made === null) {
            Alert.alert(say('phone.askWhichPlaylist.couldNotMake'));

            return;
          }

          onChanged();
          onPlaylist?.(made.id);
        });

        return;
      }

      const chosen = playlists[picked - 1];

      if (chosen === undefined) {
        return;
      }

      void addToPlaylist(chosen.id, [track.id]).then((isAdded) => {
        if (!isAdded) {
          Alert.alert(say('phone.askWhichPlaylist.couldNotAdd', { name: chosen.name }));

          return;
        }

        onChanged();
      });
    },
  );
};

export { askWhichPlaylist };
