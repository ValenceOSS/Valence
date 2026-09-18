import { albumArtworkUrl, fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { AlbumShelfProps } from './AlbumShelf.types';

/**
 * The line under an album's name where nobody says otherwise: who it is by and when.
 *
 * @param album - The album.
 * @returns The line.
 */
const byAndWhen = (album: MusicAlbum): string =>
  [album.year?.toString(), album.artist.name].filter((part) => part !== undefined).join(' · ');

/**
 * A heading and a grid of albums under it, each opening its page or playing straight away — or
 * nothing at all where there are no albums, so a page never shows an empty heading.
 *
 * @param heading - What the albums are.
 * @param albums - The albums.
 * @param detailOf - The line under each album's name.
 */
const AlbumShelf = ({ heading, albums, detailOf = byAndWhen }: AlbumShelfProps) => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  if (albums.length === 0) {
    return null;
  }

  return (
    <section aria-label={heading} className="flex flex-col gap-3">
      <h2 className="px-2 text-xl font-bold tracking-tight text-text">{heading}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1">
        {albums.map((album) => (
          <MusicTile
            key={album.id}
            title={album.title}
            detail={detailOf(album)}
            artwork={
              <MusicArtwork
                src={album.hasArtwork ? albumArtworkUrl(album.id) : null}
                label={album.title}
                className="w-full"
              />
            }
            onOpen={() => {
              open({ kind: 'album', id: album.id });
            }}
            onPlay={() => {
              void fetchAlbum(album.id).then((read) => {
                player.play(read.tracks, 0, {
                  source: { kind: 'album', id: album.id, name: album.title },
                });
              });
            }}
          />
        ))}
      </div>
    </section>
  );
};

AlbumShelf.displayName = 'AlbumShelf';

export { AlbumShelf };
