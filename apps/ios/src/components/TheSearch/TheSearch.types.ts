import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheSearchProps = {
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onAsk: ((about: CatalogueBrowseKind, id: string) => void) | null;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist: (playlistId: string) => void;
  onBook: (bookId: string) => void;
};

export type { TheSearchProps };
