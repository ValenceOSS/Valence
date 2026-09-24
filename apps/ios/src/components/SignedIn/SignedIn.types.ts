import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';
import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type SignedInProps = {
  onOut: () => void;
  onElsewhere: () => void;
  onFaceAt?: (at: ARectOnScreen) => void;
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
  | { kind: 'albums' }
  | { kind: 'artists' }
  | { kind: 'television'; code: string; askedFrom: string | null }
  | { kind: 'book'; bookId: string }
  | { kind: 'reading'; bookId: string; chapterId: string | null; isFromTheStart: boolean }
  | { kind: 'playing' };

export type { APage, SignedInProps };
