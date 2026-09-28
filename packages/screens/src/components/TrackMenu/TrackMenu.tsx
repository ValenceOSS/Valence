import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  ChevronDown as ChevronDownFilledIcon,
  ChevronUp as ChevronUpFilledIcon,
  ListOrdered as ListOrderedFilledIcon,
  Record as RecordFilledIcon,
  SkipForward as SkipForwardFilledIcon,
  User as UserFilledIcon,
  Video as VideoFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Icon } from '@ValenceUI/Icon';
import { notify } from '@ValenceUI/notify';
import { setMusicVideo } from '@ValenceScreens/music/musicVideo';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMyPlaylists } from '@ValenceClient/music/useMyPlaylists';
import { playlistGroupFor } from '@ValenceScreens/music/playlistGroupFor';
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
  const { player } = useMusicPlayer();
  const { open } = useMusicNavigation();
  const playlists = useMyPlaylists();
  const [artist] = track.artists;

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
              icon: <Icon of={SkipForwardFilledIcon} size={16} />,
              onChoose: () => {
                player.playNext([track]);
                notify.say(`${track.title} plays next`);
              },
            },
            {
              id: 'queue',
              label: 'Add to queue',
              icon: <Icon of={ListOrderedFilledIcon} size={16} />,
              onChoose: () => {
                player.addToQueue([track]);
                notify.say(`Added ${track.title} to the queue`);
              },
            },
          ],
        },
        playlistGroupFor(track.title, () => Promise.resolve([track.id]), playlists, open),
        {
          items: [
            ...(track.videoKey === null
              ? []
              : [
                  {
                    id: 'video',
                    label: 'Watch the video',
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
              label: 'Go to album',
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
                    label: 'Go to artist',
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
                    label: 'Move up',
                    icon: <Icon of={ChevronUpFilledIcon} size={16} />,
                    onChoose: onMoveUp,
                  },
                ]),
            ...(onMoveDown === undefined
              ? []
              : [
                  {
                    id: 'down',
                    label: 'Move down',
                    icon: <Icon of={ChevronDownFilledIcon} size={16} />,
                    onChoose: onMoveDown,
                  },
                ]),
            ...(onRemove === undefined
              ? []
              : [
                  {
                    id: 'remove',
                    label: 'Remove from this playlist',
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
