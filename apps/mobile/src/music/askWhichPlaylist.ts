import { ActionSheetIOS, Alert } from 'react-native';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

const MOST_AT_ONCE = 500;

/**
 * Offers somebody's own playlists to put a track or a whole album in, in the system's action sheet,
 * as the web's menus do: a new one named after it, which is then opened, or one they already have.
 *
 * @param name - What is being added, which names a new playlist.
 * @param songIds - Reads the songs to add, only once a playlist is chosen.
 * @param playlists - Their own playlists.
 * @param onChanged - Told a playlist changed, so what shows them can read them again.
 * @param onPlaylist - Told to open the new playlist, where there is somewhere to open it.
 */
const askWhichPlaylist = (
  name: string,
  songIds: () => Promise<string[]>,
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
      const chosen = playlists[picked - 1];

      if (picked !== 0 && chosen === undefined) {
        return;
      }

      void songIds().then(async (found) => {
        const ids = found.slice(0, MOST_AT_ONCE);

        if (ids.length === 0) {
          Alert.alert(`There is nothing in ${name} to add.`);

          return;
        }

        if (chosen === undefined) {
          const made = await createPlaylist({ name, mediaItemIds: ids });

          if (made === null) {
            Alert.alert('That playlist could not be made.');

            return;
          }

          onChanged();
          onPlaylist?.(made.id);

          return;
        }

        if (!(await addToPlaylist(chosen.id, ids))) {
          Alert.alert(`That could not be added to ${chosen.name}.`);

          return;
        }

        onChanged();
      });
    },
  );
};

export { askWhichPlaylist };
