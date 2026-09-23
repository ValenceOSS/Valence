import { ActionSheetIOS } from 'react-native';
import { askWhichPlaylist } from '@ValencePhone/music/askWhichPlaylist';
import type { AskAboutATrack } from './askAboutATrack.types';

/**
 * Offers what can be done with one track, in the system's action sheet, as the web's track menu
 * offers it: play it next, add it to the end of the queue, put it in a playlist, like it or stop
 * liking it, or go to its album or its artist — and, in a playlist of somebody's own, move it up or
 * down or take it out.
 *
 * @param asking - The track, the player to queue it with, and everything the menu can do with it.
 */
const askAboutATrack = ({
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
}: AskAboutATrack): void => {
  const artist = track.artists[0] ?? null;
  const choices = [
    { label: 'Play next', run: () => player.playNext([track]) },
    { label: 'Add to queue', run: () => player.addToQueue([track]) },
    {
      label: 'Add to playlist…',
      run: () => {
        askWhichPlaylist(track, playlists, onPlaylistsChanged, onPlaylist);
      },
    },
    { label: isLiked ? 'Remove from liked songs' : 'Like', run: onLike },
    { label: 'Go to album', run: () => onAlbum(track.album.id) },
    ...(artist === null ? [] : [{ label: 'Go to artist', run: () => onArtist(artist.id) }]),
    ...(inAPlaylist === undefined
      ? []
      : [
          ...(inAPlaylist.canMoveUp ? [{ label: 'Move up', run: inAPlaylist.onMoveUp }] : []),
          ...(inAPlaylist.canMoveDown ? [{ label: 'Move down', run: inAPlaylist.onMoveDown }] : []),
          { label: 'Remove from this playlist', run: inAPlaylist.onRemove },
        ]),
  ];

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: track.title,
      options: [...choices.map((choice) => choice.label), 'Cancel'],
      cancelButtonIndex: choices.length,
      ...(inAPlaylist === undefined ? {} : { destructiveButtonIndex: choices.length - 1 }),
    },
    (picked) => {
      choices[picked]?.run();
    },
  );
};

export { askAboutATrack };
