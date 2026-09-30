import { ActionSheetIOS, Alert } from 'react-native';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import { say } from '@ValenceI18n/say';

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
      title: say('common.addToPlaylist'),
      options: [
        say('common.newPlaylist'),
        ...playlists.map((playlist) => playlist.name),
        say('common.cancel'),
      ],
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
          Alert.alert(say('common.thereIsNothingInNameTo', { name }));

          return;
        }

        if (chosen === undefined) {
          const made = await createPlaylist({ name, mediaItemIds: ids });

          if (made === null) {
            Alert.alert(say('common.thatPlaylistCouldNotBeMade'));

            return;
          }

          onChanged();
          onPlaylist?.(made.id);

          return;
        }

        if (!(await addToPlaylist(chosen.id, ids))) {
          Alert.alert(say('common.thatCouldNotBeAddedTo', { name: chosen.name }));

          return;
        }

        onChanged();
      });
    },
  );
};

export { askWhichPlaylist };
