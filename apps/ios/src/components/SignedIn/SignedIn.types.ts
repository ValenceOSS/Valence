import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type SignedInProps = {
  onOut: () => void;
};

type APage =
  | { kind: 'title'; mediaId: string }
  | { kind: 'show'; libraryId: string; showId: string }
  | { kind: 'series'; seriesId: string }
  | { kind: 'person'; personId: number }
  | { kind: 'asking'; about: CatalogueBrowseKind; id: string }
  | { kind: 'notifications' }
  | { kind: 'album'; albumId: string }
  | { kind: 'artist'; artistId: string }
  | { kind: 'playlist'; playlistId: string }
  | { kind: 'liked' }
  | { kind: 'playing' };

export type { APage, SignedInProps };
