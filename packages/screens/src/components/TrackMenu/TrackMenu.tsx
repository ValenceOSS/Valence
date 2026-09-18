import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Add01Icon,
  Album02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  LeftToRightListNumberIcon,
  MoreHorizontalIcon,
  NextIcon,
  PlayListIcon,
  User03Icon,
} from '@hugeicons/core-free-icons';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Icon } from '@ValenceUI/Icon';
import { notify } from '@ValenceUI/notify';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { TrackMenuProps } from './TrackMenu.types';

/**
 * Everything that can be done with one song besides playing it: queue it, put it in a playlist, go
 * to its album or artist, or take it out of the playlist it is in.
 *
 * A playlist is added to in one press from here. Making a new one names it after the song, which
 * is the one thing known about what it is for, and it can be renamed on its own page.
 *
 * @param track - The song.
 * @param onRemove - Takes it out of the playlist being shown, where it is in one of yours.
 * @param onMoveUp - Moves it one place earlier in the playlist being shown, where it can go.
 * @param onMoveDown - Moves it one place later, where it can go.
 * @param className - Anything the caller's layout needs.
 */
const TrackMenu = ({ track, onRemove, onMoveUp, onMoveDown, className }: TrackMenuProps) => {
  const cache = useQueryClient();
  const { player } = useMusicPlayer();
  const { open } = useMusicNavigation();
  const playlists = useQuery(musicQueries.playlists());
  const mine = (playlists.data ?? []).filter((playlist) => playlist.isMine);
  const [artist] = track.artists;

  const refresh = () => {
    void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
  };

  return (
    <ActionMenu
      label={`More for ${track.title}`}
      align="end"
      size="sm"
      {...(className === undefined ? {} : { className })}
      trigger={<Icon of={MoreHorizontalIcon} size={18} />}
      groups={[
        {
          items: [
            {
              id: 'next',
              label: 'Play next',
              icon: <Icon of={NextIcon} size={16} />,
              onChoose: () => {
                player.playNext([track]);
                notify.say(`${track.title} plays next`);
              },
            },
            {
              id: 'queue',
              label: 'Add to queue',
              icon: <Icon of={LeftToRightListNumberIcon} size={16} />,
              onChoose: () => {
                player.addToQueue([track]);
                notify.say(`Added ${track.title} to the queue`);
              },
            },
          ],
        },
        {
          name: 'Add to playlist',
          items: [
            {
              id: 'new',
              label: 'New playlist',
              icon: <Icon of={Add01Icon} size={16} />,
              onChoose: () => {
                void createPlaylist({ name: track.title, mediaItemIds: [track.id] }).then(
                  (made) => {
                    refresh();

                    if (made === null) {
                      notify.failed('That playlist could not be made.');

                      return;
                    }

                    open({ kind: 'playlist', id: made.id });
                  },
                );
              },
            },
            ...mine.map((playlist) => ({
              id: `playlist-${playlist.id}`,
              label: playlist.name,
              icon: <Icon of={PlayListIcon} size={16} />,
              onChoose: () => {
                void addToPlaylist(playlist.id, [track.id]).then((added) => {
                  refresh();

                  if (added) {
                    notify.worked(`Added to ${playlist.name}`);
                  } else {
                    notify.failed(`That could not be added to ${playlist.name}.`);
                  }
                });
              },
            })),
          ],
        },
        {
          items: [
            {
              id: 'album',
              label: 'Go to album',
              icon: <Icon of={Album02Icon} size={16} />,
              onChoose: () => {
                open({ kind: 'album', id: track.album.id });
              },
            },
            ...(artist === undefined
              ? []
              : [
                  {
                    id: 'artist',
                    label: 'Go to artist',
                    icon: <Icon of={User03Icon} size={16} />,
                    onChoose: () => {
                      open({ kind: 'artist', id: artist.id });
                    },
                  },
                ]),
            ...(onMoveUp === undefined
              ? []
              : [
                  {
                    id: 'up',
                    label: 'Move up',
                    icon: <Icon of={ArrowUp01Icon} size={16} />,
                    onChoose: onMoveUp,
                  },
                ]),
            ...(onMoveDown === undefined
              ? []
              : [
                  {
                    id: 'down',
                    label: 'Move down',
                    icon: <Icon of={ArrowDown01Icon} size={16} />,
                    onChoose: onMoveDown,
                  },
                ]),
            ...(onRemove === undefined
              ? []
              : [
                  {
                    id: 'remove',
                    label: 'Remove from this playlist',
                    icon: <Icon of={Delete02Icon} size={16} />,
                    isDestructive: true,
                    onChoose: onRemove,
                  },
                ]),
          ],
        },
      ]}
    />
  );
};

TrackMenu.displayName = 'TrackMenu';

export { TrackMenu };
