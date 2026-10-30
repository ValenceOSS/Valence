import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';
import type { CatalogueBrowse, CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';

type SignedInProps = {
  onOut: () => void;
  onElsewhere: () => void;
  onFaceAt?: (at: ARectOnScreen, isATile?: boolean) => void;
  isFaceArriving?: boolean;
};

type AKindOfPage =
  | { kind: 'title'; mediaId: string }
  | { kind: 'show'; libraryId: string; showId: string }
  | { kind: 'series'; seriesId: string }
  | { kind: 'person'; personId: number }
  | { kind: 'collection'; collectionId: string }
  | { kind: 'asking'; about: MediaRequestKind; id: string; isMore?: boolean }
  | { kind: 'browsing'; browsing: CatalogueBrowse | CatalogueSearch; title: string }
  | { kind: 'calendar' }
  | { kind: 'downloads' }
  | { kind: 'requests' }
  | { kind: 'album'; albumId: string }
  | { kind: 'artist'; artistId: string }
  | { kind: 'playlist'; playlistId: string; isRequestingMissing?: boolean }
  | { kind: 'liked' }
  | { kind: 'mix'; mixId: string }
  | { kind: 'albums' }
  | { kind: 'artists' }
  | { kind: 'television'; code: string; askedFrom: string | null }
  | { kind: 'book'; bookId: string }
  | { kind: 'reading'; bookId: string; chapterId: string | null; isFromTheStart: boolean }
  | { kind: 'playing' }
  | { kind: 'listening' }
  | { kind: 'me' }
  | { kind: 'inbox' }
  | { kind: 'account'; panel: string };

type APage = AKindOfPage & { from?: APage };

export type { APage, SignedInProps };
