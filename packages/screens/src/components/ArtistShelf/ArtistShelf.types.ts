import type { MusicArtist } from '@ValenceContracts/schemas/Music';

type ArtistShelfProps = {
  heading: string;
  artists: readonly MusicArtist[];
};

export type { ArtistShelfProps };
