import { fetchPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { PlaylistCover } from '@ValenceScreens/components/PlaylistCover/PlaylistCover';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
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
 * A heading and a grid of playlists under it, each opening its page or playing straight away — or
 * nothing at all where there are none.
 *
 * @param heading - What the playlists are.
 * @param playlists - The playlists.
 */
const PlaylistShelf = ({ heading, playlists }: PlaylistShelfProps) => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  if (playlists.length === 0) {
    return null;
  }

  return (
    <section aria-label={heading} className="flex flex-col gap-3">
      <h2 className="px-2 text-xl font-bold tracking-tight text-text">{heading}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1">
        {playlists.map((playlist) => (
          <MusicTile
            key={playlist.id}
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
        ))}
      </div>
    </section>
  );
};

PlaylistShelf.displayName = 'PlaylistShelf';

export { PlaylistShelf, describePlaylist };
