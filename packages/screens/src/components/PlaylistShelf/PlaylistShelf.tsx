import { fetchPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { musicMenuFor } from '@ValenceScreens/music/musicMenuFor';
import { RevealItem } from '@ValenceUI/RevealItem';
import { MusicShelf } from '@ValenceScreens/components/MusicShelf/MusicShelf';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';
import type { PlaylistShelfProps } from './PlaylistShelf.types';

/**
 * The line under a playlist's name: whose it is where it is somebody else's, and how much is in it.
 *
 * @param playlist - The playlist.
 * @returns The line.
 */
const describePlaylist = (playlist: PlaylistSummary): string =>
  [
    playlist.isMine ? null : `By ${playlist.owner.name}`,
    playlist.entryCount === 1 ? '1 thing' : `${playlist.entryCount.toString()} things`,
  ]
    .filter((part) => part !== null)
    .join(' · ');

/**
 * A shelf of playlists under it, each opening its page or playing straight away — or
 * nothing at all where there are none.
 *
 * @param heading - What the playlists are.
 * @param playlists - The playlists.
 * @param layout - A rail to page through, or a grid that wraps, for a page that is only this.
 * @param action - Anything to do with the whole shelf, beside its heading.
 * @param leading - A tile to put before the playlists, such as somebody's liked songs.
 */
const PlaylistShelf = ({
  heading,
  playlists,
  layout = 'rail',
  leading,
  action,
}: PlaylistShelfProps) => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  if (playlists.length === 0 && leading === undefined) {
    return null;
  }

  return (
    <MusicShelf heading={heading} layout={layout} action={action}>
      {leading === undefined ? null : (
        <RevealItem index={0}>
          <MusicTile {...leading} />
        </RevealItem>
      )}
      {playlists.map((playlist, at) => (
        <RevealItem key={playlist.id} index={at + (leading === undefined ? 0 : 1)}>
          <MusicTile
            title={playlist.name}
            detail={describePlaylist(playlist)}
            artwork={
              <PlaylistCover
                name={playlist.name}
                albumIds={playlist.artworkAlbumIds}
                className="w-full"
              />
            }
            onOpen={() => {
              open({ kind: 'playlist', id: playlist.id });
            }}
            menu={musicMenuFor({ kind: 'playlist', id: playlist.id }, playlist.name, player, open)}
            onPlay={() => {
              void fetchPlaylist(playlist.id).then((read) => {
                const tracks = read.entries.flatMap((entry) =>
                  entry.item.track === null ? [] : [entry.item.track],
                );

                player.play(tracks, 0, {
                  source: { kind: 'playlist', id: playlist.id, name: playlist.name },
                  isOrdered: playlist.isOrdered,
                });
              });
            }}
          />
        </RevealItem>
      ))}
    </MusicShelf>
  );
};

PlaylistShelf.displayName = 'PlaylistShelf';

export { PlaylistShelf, describePlaylist };
