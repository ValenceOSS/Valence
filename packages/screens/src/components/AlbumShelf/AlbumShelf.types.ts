import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

type AlbumShelfProps = {
  heading: string;
  albums: readonly MusicAlbum[];
  detailOf?: (album: MusicAlbum) => string;
};

export type { AlbumShelfProps };
