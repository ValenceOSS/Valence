import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  ChevronDown as ChevronDownFilledIcon,
  ChevronUp as ChevronUpFilledIcon,
  ListMusic as ListMusicFilledIcon,
  ListOrdered as ListOrderedFilledIcon,
  Plus as PlusFilledIcon,
  Record as RecordFilledIcon,
  SkipForward as SkipForwardFilledIcon,
  User as UserFilledIcon,
  Video as VideoFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Icon } from '@ValenceUI/Icon';
import { notify } from '@ValenceUI/notify';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { setMusicVideo } from '@ValenceScreens/music/musicVideo';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import type { TrackMenuProps } from './TrackMenu.types';
import { say } from '@ValenceI18n/say';

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
      label={say('screens.trackMenu.moreFor', { title: track.title })}
      align="end"
      size="sm"
      {...(className === undefined ? {} : { className })}
      trigger={<Icon of={MoreHorizontalIcon} size={18} />}
      groups={[
        {
          items: [
            {
              id: 'next',
              label: say('screens.trackMenu.playNext'),
              icon: <Icon of={SkipForwardFilledIcon} size={16} />,
              onChoose: () => {
                player.playNext([track]);
                notify.say(say('screens.trackMenu.playsNext', { title: track.title }));
              },
            },
            {
              id: 'queue',
              label: say('screens.trackMenu.addToQueue'),
              icon: <Icon of={ListOrderedFilledIcon} size={16} />,
              onChoose: () => {
                player.addToQueue([track]);
                notify.say(say('screens.trackMenu.addedToQueue', { title: track.title }));
              },
            },
          ],
        },
        {
          name: say('screens.trackMenu.addToPlaylist'),
          items: [
            {
              id: 'new',
              label: say('screens.trackMenu.newPlaylist'),
              icon: <Icon of={PlusFilledIcon} size={16} />,
              onChoose: () => {
                void createPlaylist({ name: track.title, mediaItemIds: [track.id] }).then(
                  (made) => {
                    refresh();

                    if (made === null) {
                      notify.failed(say('screens.trackMenu.couldNotMakePlaylist'));

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
              icon: <Icon of={ListMusicFilledIcon} size={16} />,
              onChoose: () => {
                void addToPlaylist(playlist.id, [track.id]).then((added) => {
                  refresh();

                  if (added) {
                    notify.worked(say('screens.trackMenu.addedTo', { name: playlist.name }));
                  } else {
                    notify.failed(say('screens.trackMenu.couldNotAddTo', { name: playlist.name }));
                  }
                });
              },
            })),
          ],
        },
        {
          items: [
            ...(track.videoKey === null
              ? []
              : [
                  {
                    id: 'video',
                    label: say('screens.trackMenu.watchTheVideo'),
                    icon: <Icon of={VideoFilledIcon} size={16} />,
                    onChoose: () => {
                      if (track.videoKey !== null) {
                        player.pause();
                        setMusicVideo({ title: track.title, videoKey: track.videoKey });
                      }
                    },
                  },
                ]),
            {
              id: 'album',
              label: say('screens.trackMenu.goToAlbum'),
              icon: <Icon of={RecordFilledIcon} size={16} />,
              onChoose: () => {
                open({ kind: 'album', id: track.album.id });
              },
            },
            ...(artist === undefined
              ? []
              : [
                  {
                    id: 'artist',
                    label: say('screens.trackMenu.goToArtist'),
                    icon: <Icon of={UserFilledIcon} size={16} />,
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
                    label: say('screens.trackMenu.moveUp'),
                    icon: <Icon of={ChevronUpFilledIcon} size={16} />,
                    onChoose: onMoveUp,
                  },
                ]),
            ...(onMoveDown === undefined
              ? []
              : [
                  {
                    id: 'down',
                    label: say('screens.trackMenu.moveDown'),
                    icon: <Icon of={ChevronDownFilledIcon} size={16} />,
                    onChoose: onMoveDown,
                  },
                ]),
            ...(onRemove === undefined
              ? []
              : [
                  {
                    id: 'remove',
                    label: say('screens.trackMenu.removeFromPlaylist'),
                    icon: <Icon of={BinFilledIcon} size={16} />,
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
