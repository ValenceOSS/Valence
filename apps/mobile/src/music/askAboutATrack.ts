import { ActionSheetIOS } from 'react-native';
import { askWhichPlaylist } from '@ValenceMobile/music/askWhichPlaylist';
import { say } from '@ValenceI18n/say';
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
    { label: say('phone.askAboutATrack.playNext'), run: () => player.playNext([track]) },
    { label: say('phone.askAboutATrack.addToQueue'), run: () => player.addToQueue([track]) },
    {
      label: say('phone.askAboutATrack.addToPlaylist'),
      run: () => {
        askWhichPlaylist(track, playlists, onPlaylistsChanged, onPlaylist);
      },
    },
    {
      label: isLiked ? say('phone.askAboutATrack.unlike') : say('phone.askAboutATrack.like'),
      run: onLike,
    },
    { label: say('phone.askAboutATrack.goToAlbum'), run: () => onAlbum(track.album.id) },
    ...(artist === null
      ? []
      : [{ label: say('phone.askAboutATrack.goToArtist'), run: () => onArtist(artist.id) }]),
    ...(inAPlaylist === undefined
      ? []
      : [
          ...(inAPlaylist.canMoveUp
            ? [{ label: say('phone.askAboutATrack.moveUp'), run: inAPlaylist.onMoveUp }]
            : []),
          ...(inAPlaylist.canMoveDown
            ? [{ label: say('phone.askAboutATrack.moveDown'), run: inAPlaylist.onMoveDown }]
            : []),
          { label: say('phone.askAboutATrack.removeFromPlaylist'), run: inAPlaylist.onRemove },
        ]),
  ];

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: track.title,
      options: [...choices.map((choice) => choice.label), say('common.cancel')],
      cancelButtonIndex: choices.length,
      ...(inAPlaylist === undefined ? {} : { destructiveButtonIndex: choices.length - 1 }),
    },
    (picked) => {
      choices[picked]?.run();
    },
  );
};

export { askAboutATrack };
