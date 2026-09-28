import { ActionSheetIOS } from 'react-native';
import { fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { useMyPlaylists } from '@ValenceClient/music/useMyPlaylists';
import { askWhichPlaylist } from '@ValenceMobile/music/askWhichPlaylist';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

/**
 * What an album held down offers, in the system's action sheet, as the web's album menu does: play
 * it, shuffle it, put it next or at the end of the queue, or add the whole of it to a playlist.
 *
 * @param onPlaylist - Told to open a playlist made from it, where there is somewhere to open it.
 * @returns What to call with the album that was held down.
 */
const useAskAboutAnAlbum = (
  onPlaylist?: (playlistId: string) => void,
): ((album: { id: string; title: string }) => void) => {
  const player = thePhonesMusicPlayer();
  const playlists = useMyPlaylists();

  return (album) => {
    const source = { kind: 'album' as const, id: album.id, name: album.title };

    /**
     * Reads the album's songs and does something with them, once there are any.
     *
     * @param then - What to do with its songs.
     */
    const withSongs = (then: (tracks: MusicTrack[]) => void) => {
      void fetchAlbum(album.id).then((read) => {
        if (read.tracks.length > 0) {
          then(read.tracks);
        }
      });
    };
    const choices = [
      {
        label: 'Play',
        run: () => {
          withSongs((tracks) => {
            player.play(tracks, 0, { source });
          });
        },
      },
      {
        label: 'Shuffle',
        run: () => {
          withSongs((tracks) => {
            player.play(tracks, Math.floor(Math.random() * tracks.length), {
              source,
              isShuffled: true,
            });
          });
        },
      },
      {
        label: 'Play next',
        run: () => {
          withSongs((tracks) => {
            player.playNext(tracks);
          });
        },
      },
      {
        label: 'Add to queue',
        run: () => {
          withSongs((tracks) => {
            player.addToQueue(tracks);
          });
        },
      },
      {
        label: 'Add to playlist…',
        run: () => {
          askWhichPlaylist(
            album.title,
            async () => (await fetchAlbum(album.id)).tracks.map((track) => track.id),
            playlists.mine,
            playlists.changed,
            onPlaylist,
          );
        },
      },
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: album.title,
        options: [...choices.map((choice) => choice.label), 'Cancel'],
        cancelButtonIndex: choices.length,
      },
      (picked) => {
        choices[picked]?.run();
      },
    );
  };
};

export { useAskAboutAnAlbum };
