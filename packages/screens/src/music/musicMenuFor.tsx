import {
  Eye as EyeIcon,
  ListPlus as ListPlusIcon,
  Shuffle as ShuffleIcon,
} from '@keyline-icons/react';
import {
  Play as PlayFilledIcon,
  SkipForward as SkipForwardFilledIcon,
} from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { tracksFor } from '@ValenceClient/music/tracksFor';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import type { MusicView } from '@ValenceClient/music/musicView';

/**
 * What can be done to an album, an artist, a playlist or somebody's liked songs from wherever it is
 * shown — play it, shuffle it, put it next or at the end of the queue, or open it — for the menu
 * that opens over it.
 *
 * Its songs are only fetched once something is chosen, so a list of a hundred albums does not
 * fetch a hundred albums' songs to be ready for a right-click that may never come.
 *
 * @param view - The page it opens.
 * @param name - What it is called.
 * @param player - The player to hand its songs to.
 * @param open - Opens a page of the music section.
 * @returns The menu's items.
 */
const musicMenuFor = (
  view: MusicView,
  name: string,
  player: MusicPlayer,
  open: (view: MusicView) => void,
): ActionMenuGroup[] => {
  const withSongs = (then: (found: NonNullable<Awaited<ReturnType<typeof tracksFor>>>) => void) => {
    void tracksFor(view, name).then((found) => {
      if (found !== null && found.tracks.length > 0) {
        then(found);
      }
    });
  };

  return [
    {
      items: [
        {
          id: 'play',
          label: 'Play',
          icon: <Icon of={PlayFilledIcon} size={16} />,
          onChoose: () => {
            withSongs(({ tracks, source, isOrdered }) => {
              player.play(tracks, 0, { source, isOrdered });
            });
          },
        },
        {
          id: 'shuffle',
          label: 'Shuffle',
          icon: <Icon of={ShuffleIcon} size={16} />,
          onChoose: () => {
            withSongs(({ tracks, source }) => {
              player.play(tracks, Math.floor(Math.random() * tracks.length), {
                source,
                isShuffled: true,
              });
            });
          },
        },
        {
          id: 'next',
          label: 'Play next',
          icon: <Icon of={SkipForwardFilledIcon} size={16} />,
          onChoose: () => {
            withSongs(({ tracks }) => {
              player.playNext(tracks);
            });
          },
        },
        {
          id: 'queue',
          label: 'Add to queue',
          icon: <Icon of={ListPlusIcon} size={16} />,
          onChoose: () => {
            withSongs(({ tracks }) => {
              player.addToQueue(tracks);
            });
          },
        },
      ],
    },
    {
      items: [
        {
          id: 'open',
          label: `Open ${name}`,
          icon: <Icon of={EyeIcon} size={16} />,
          onChoose: () => {
            open(view);
          },
        },
      ],
    },
  ];
};

export { musicMenuFor };
