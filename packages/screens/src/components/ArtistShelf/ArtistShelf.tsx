import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { musicMenuFor } from '@ValenceScreens/music/musicMenuFor';
import { RevealItem } from '@ValenceUI/RevealItem';
import { MusicShelf } from '@ValenceScreens/components/MusicShelf/MusicShelf';
import type { MusicArtist } from '@ValenceContracts/schemas/Music';
import type { ArtistShelfProps } from './ArtistShelf.types';

/**
 * Where an artist's picture comes from: their own where one is kept, otherwise the cover of their
 * latest album, which is what most people picture an artist by anyway.
 *
 * @param artist - The artist.
 * @returns The picture's address, or nothing.
 */
const pictureOf = (artist: MusicArtist): string | null => {
  if (artist.hasImage) {
    return artistImageUrl(artist.id);
  }

  return artist.imageAlbumId === null ? null : albumArtworkUrl(artist.imageAlbumId);
};

/**
 * A shelf of artists under it, drawn round the way people are — or nothing at all
 * where there are none.
 *
 * @param heading - What the artists are.
 * @param artists - The artists.
 * @param layout - A rail to page through, or a grid that wraps, for a page that is only this.
 * @param action - Anything to do with the whole shelf, beside its heading.
 */
const ArtistShelf = ({ heading, artists, layout = 'rail', action }: ArtistShelfProps) => {
  const { open } = useMusicNavigation();
  const { player } = useMusicPlayer();

  if (artists.length === 0) {
    return null;
  }

  return (
    <MusicShelf heading={heading} layout={layout} action={action}>
      {artists.map((artist, at) => (
        <RevealItem key={artist.id} index={at}>
          <MusicTile
            title={artist.name}
            detail="Artist"
            artwork={
              <MusicArtwork
                src={pictureOf(artist)}
                label={artist.name}
                shape="round"
                travelsAs={`artist-${artist.id}`}
                className="w-full"
              />
            }
            onOpen={() => {
              open({ kind: 'artist', id: artist.id });
            }}
            menu={musicMenuFor({ kind: 'artist', id: artist.id }, artist.name, player, open)}
          />
        </RevealItem>
      ))}
    </MusicShelf>
  );
};

ArtistShelf.displayName = 'ArtistShelf';

export { ArtistShelf, pictureOf };
