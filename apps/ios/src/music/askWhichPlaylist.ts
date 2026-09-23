import { ActionSheetIOS, Alert } from 'react-native';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
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
      title: 'Add to playlist',
      options: ['New playlist', ...playlists.map((playlist) => playlist.name), 'Cancel'],
      cancelButtonIndex: playlists.length + 1,
    },
    (picked) => {
      if (picked === 0) {
        void createPlaylist({ name: track.title, mediaItemIds: [track.id] }).then((made) => {
          if (made === null) {
            Alert.alert('That playlist could not be made.');

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
          Alert.alert(`That could not be added to ${chosen.name}.`);

          return;
        }

        onChanged();
      });
    },
  );
};

export { askWhichPlaylist };
