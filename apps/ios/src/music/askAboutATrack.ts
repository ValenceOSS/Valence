import { ActionSheetIOS } from 'react-native';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

/**
 * Offers what can be done with one track, in the system's action sheet, as the web's track menu
 * offers it: play it next, add it to the end of the queue, like it or stop liking it, or go to its
 * album or its artist.
 *
 * @param track - The track.
 * @param player - The music player, to queue it with.
 * @param isLiked - Whether it is already liked.
 * @param onLike - Told to like it, or stop.
 * @param onAlbum - Told to open its album.
 * @param onArtist - Told to open its first artist.
 */
const askAboutATrack = (
  track: MusicTrack,
  player: MusicPlayer,
  isLiked: boolean,
  onLike: () => void,
  onAlbum: (albumId: string) => void,
  onArtist: (artistId: string) => void,
): void => {
  const artist = track.artists[0] ?? null;
  const choices = [
    { label: 'Play next', run: () => player.playNext([track]) },
    { label: 'Add to queue', run: () => player.addToQueue([track]) },
    { label: isLiked ? 'Remove from liked songs' : 'Like', run: onLike },
    { label: 'Go to album', run: () => onAlbum(track.album.id) },
    ...(artist === null ? [] : [{ label: 'Go to artist', run: () => onArtist(artist.id) }]),
  ];

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: track.title,
      options: [...choices.map((choice) => choice.label), 'Cancel'],
      cancelButtonIndex: choices.length,
    },
    (picked) => {
      choices[picked]?.run();
    },
  );
};

export { askAboutATrack };
