import { showActionSheet } from '@ValenceMobile/platform/showActionSheet';
import { askWhichPlaylist } from '@ValenceMobile/music/askWhichPlaylist';
import type { AskAboutATrack } from './askAboutATrack.types';
import { say } from '@ValenceI18n/say';

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
    { label: say('common.playNext'), run: () => player.playNext([track]) },
    { label: say('common.addToQueue'), run: () => player.addToQueue([track]) },
    {
      label: say('common.addToPlaylist2'),
      run: () => {
        askWhichPlaylist(
          track.title,
          () => Promise.resolve([track.id]),
          playlists,
          onPlaylistsChanged,
          onPlaylist,
        );
      },
    },
    { label: isLiked ? say('common.removeFromLikedSongs') : say('common.like'), run: onLike },
    { label: say('common.goToAlbum'), run: () => onAlbum(track.album.id) },
    ...(artist === null
      ? []
      : [{ label: say('common.goToArtist'), run: () => onArtist(artist.id) }]),
    ...(inAPlaylist === undefined
      ? []
      : [
          ...(inAPlaylist.canMoveUp
            ? [{ label: say('common.moveUp'), run: inAPlaylist.onMoveUp }]
            : []),
          ...(inAPlaylist.canMoveDown
            ? [{ label: say('common.moveDown'), run: inAPlaylist.onMoveDown }]
            : []),
          { label: say('common.removeFromThisPlaylist'), run: inAPlaylist.onRemove },
        ]),
  ];

  showActionSheet(
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
