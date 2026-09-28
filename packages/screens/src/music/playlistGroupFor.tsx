import {
  ListMusic as ListMusicFilledIcon,
  Plus as PlusFilledIcon,
} from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { notify } from '@ValenceUI/notify';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { MusicView } from '@ValenceClient/music/musicView';
import type { MyPlaylists } from '@ValenceClient/music/useMyPlaylists.types';

const MOST_AT_ONCE = 500;

/**
 * The menu's "Add to playlist" group for a song or a whole set of them: a new playlist named after
 * it, which is then opened, or any of this profile's own.
 *
 * @param name - What is being added, which names a new playlist.
 * @param songIds - Reads the songs to add, only once a playlist is chosen.
 * @param playlists - This profile's playlists.
 * @param open - Opens a page of the music section.
 * @returns The group.
 */
const playlistGroupFor = (
  name: string,
  songIds: () => Promise<string[]>,
  playlists: MyPlaylists,
  open: (view: MusicView) => void,
): ActionMenuGroup => {
  const withSongs = (then: (ids: string[]) => void) => {
    void songIds().then((ids) => {
      if (ids.length === 0) {
        notify.failed(`There is nothing in ${name} to add.`);

        return;
      }

      then(ids.slice(0, MOST_AT_ONCE));
    });
  };

  return {
    name: 'Add to playlist',
    items: [
      {
        id: 'new',
        label: 'New playlist',
        icon: <Icon of={PlusFilledIcon} size={16} />,
        onChoose: () => {
          withSongs((mediaItemIds) => {
            void createPlaylist({ name, mediaItemIds }).then((made) => {
              playlists.changed();

              if (made === null) {
                notify.failed('That playlist could not be made.');

                return;
              }

              open({ kind: 'playlist', id: made.id });
            });
          });
        },
      },
      ...playlists.mine.map((playlist) => ({
        id: `playlist-${playlist.id}`,
        label: playlist.name,
        icon: <Icon of={ListMusicFilledIcon} size={16} />,
        onChoose: () => {
          withSongs((ids) => {
            void addToPlaylist(playlist.id, ids).then((isAdded) => {
              playlists.changed();

              if (isAdded) {
                notify.worked(`Added to ${playlist.name}`);
              } else {
                notify.failed(`That could not be added to ${playlist.name}.`);
              }
            });
          });
        },
      })),
    ],
  };
};

export { playlistGroupFor };
