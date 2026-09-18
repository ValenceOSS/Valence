import { albumArtworkUrl, fetchAlbum } from '@ValenceClient/music/fetchMusic';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { RevealItem } from '@ValenceUI/RevealItem';
import { MusicShelf } from '@ValenceScreens/components/MusicShelf/MusicShelf';
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
 * A shelf of albums under it, each opening its page or playing straight away — or
 * nothing at all where there are no albums, so a page never shows an empty heading.
 *
 * @param heading - What the albums are.
 * @param albums - The albums.
 * @param detailOf - The line under each album's name.
 * @param layout - A rail to page through, or a grid that wraps, for a page that is only this.
 * @param action - Anything to do with the whole shelf, beside its heading.
 */
const AlbumShelf = ({
  heading,
  albums,
  detailOf = byAndWhen,
  layout = 'rail',
  action,
}: AlbumShelfProps) => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  if (albums.length === 0) {
    return null;
  }

  return (
    <MusicShelf heading={heading} layout={layout} action={action}>
      {albums.map((album, at) => (
        <RevealItem key={album.id} index={at}>
          <MusicTile
            title={album.title}
            detail={detailOf(album)}
            artwork={
              <MusicArtwork
                src={album.hasArtwork ? albumArtworkUrl(album.id) : null}
                label={album.title}
                travelsAs={`album-${album.id}`}
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
        </RevealItem>
      ))}
    </MusicShelf>
  );
};

AlbumShelf.displayName = 'AlbumShelf';

export { AlbumShelf };
