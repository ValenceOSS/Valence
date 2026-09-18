import { albumArtworkUrl, artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { useMusicNavigation } from '@ValenceScreens/music/useMusicNavigation';
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
 * A heading and a grid of artists under it, drawn round the way people are — or nothing at all
 * where there are none.
 *
 * @param heading - What the artists are.
 * @param artists - The artists.
 */
const ArtistShelf = ({ heading, artists }: ArtistShelfProps) => {
  const { open } = useMusicNavigation();

  if (artists.length === 0) {
    return null;
  }

  return (
    <section aria-label={heading} className="flex flex-col gap-3">
      <h2 className="px-2 text-xl font-bold tracking-tight text-text">{heading}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-1">
        {artists.map((artist) => (
          <MusicTile
            key={artist.id}
            title={artist.name}
            detail="Artist"
            artwork={
              <MusicArtwork
                src={pictureOf(artist)}
                label={artist.name}
                shape="round"
                className="w-full"
              />
            }
            onOpen={() => {
              open({ kind: 'artist', id: artist.id });
            }}
          />
        ))}
      </div>
    </section>
  );
};

ArtistShelf.displayName = 'ArtistShelf';

export { ArtistShelf, pictureOf };
