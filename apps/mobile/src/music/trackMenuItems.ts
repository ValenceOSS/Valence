import { askWhichPlaylist } from '@ValenceMobile/music/askWhichPlaylist';
import type { AMenuItem } from '@ValenceMobile/components/AMenu/AMenu.types';
import type { TrackMenu } from './trackMenuItems.types';
import { say } from '@ValenceI18n/say';

/**
 * What can be done with one track, for the menu that drops from its row: play it next or after
 * everything queued, add it to a playlist, like it or take it out of liked songs, and go to its
 * album or its artist; and, inside a playlist that can be changed, move it up or down or take it
 * out, which is marked as removing something.
 *
 * @param menu - The track, the player, whether it is liked, the playlists it can be added to, where
 *   it can be moved inside a playlist, and who to tell of each choice.
 * @returns The menu's items, in order.
 */
const trackMenuItems = ({
  track,
  player,
  isLiked,
  onLike,
  onAlbum,
  onArtist,
  playlists,
  onPlaylistsChanged,
  onPlaylist,
  inAPlaylist,
}: TrackMenu): AMenuItem[] => {
  const artist = track.artists[0] ?? null;

  return [
    {
      id: 'next',
      label: say('common.playNext'),
      symbol: 'text.line.first.and.arrowtriangle.forward',
      onChoose: () => {
        player.playNext([track]);
      },
    },
    {
      id: 'queue',
      label: say('common.addToQueue'),
      symbol: 'text.line.last.and.arrowtriangle.forward',
      onChoose: () => {
        player.addToQueue([track]);
      },
    },
    {
      id: 'playlist',
      label: say('common.addToPlaylist2'),
      symbol: 'text.badge.plus',
      onChoose: () => {
        askWhichPlaylist(
          track.title,
          () => Promise.resolve([track.id]),
          playlists,
          onPlaylistsChanged,
          onPlaylist,
        );
      },
    },
    {
      id: 'like',
      label: isLiked ? say('common.removeFromLikedSongs') : say('common.like'),
      symbol: isLiked ? 'heart.slash' : 'heart',
      onChoose: onLike,
    },
    {
      id: 'album',
      label: say('common.goToAlbum'),
      symbol: 'square.stack',
      startsAGroup: true,
      onChoose: () => {
        onAlbum(track.album.id);
      },
    },
    ...(artist === null
      ? []
      : [
          {
            id: 'artist',
            label: say('common.goToArtist'),
            symbol: 'music.mic' as const,
            onChoose: () => {
              onArtist(artist.id);
            },
          },
        ]),
    ...(inAPlaylist === undefined
      ? []
      : [
          ...(inAPlaylist.canMoveUp
            ? [
                {
                  id: 'up',
                  label: say('common.moveUp'),
                  symbol: 'arrow.up' as const,
                  startsAGroup: true,
                  onChoose: inAPlaylist.onMoveUp,
                },
              ]
            : []),
          ...(inAPlaylist.canMoveDown
            ? [
                {
                  id: 'down',
                  label: say('common.moveDown'),
                  symbol: 'arrow.down' as const,
                  startsAGroup: !inAPlaylist.canMoveUp,
                  onChoose: inAPlaylist.onMoveDown,
                },
              ]
            : []),
          {
            id: 'remove',
            label: say('common.removeFromThisPlaylist'),
            symbol: 'trash' as const,
            isDestructive: true,
            startsAGroup: !inAPlaylist.canMoveUp && !inAPlaylist.canMoveDown,
            onChoose: inAPlaylist.onRemove,
          },
        ]),
  ];
};

export { trackMenuItems };
