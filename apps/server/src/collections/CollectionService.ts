import type {
  Collection,
  CollectionDetail,
  CollectionSubject,
  UpdateCollection,
} from '@ValenceContracts/schemas/Collection';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type CollectionArtwork = {
  body: Uint8Array;
  contentType: string;
};

type NewCollection = {
  name: string;
  description?: string | null;
  isOrdered?: boolean;
  entries?: readonly CollectionSubject[];
  createdBy: string | null;
};

type CollectionChange = UpdateCollection;

type CollectionReading = {
  containing?: CollectionSubject;
  withEmpty?: boolean;
};

type CollectionService = {
  list: (viewer: Viewer, reading?: CollectionReading) => Promise<Collection[]>;
  get: (
    viewer: Viewer,
    collectionId: string,
    withEmpty?: boolean,
  ) => Promise<CollectionDetail | null>;
  create: (collection: NewCollection) => Promise<Collection>;
  update: (collectionId: string, change: CollectionChange) => Promise<Collection | null>;
  remove: (collectionId: string) => Promise<boolean>;
  replaceEntries: (collectionId: string, entries: readonly CollectionSubject[]) => Promise<boolean>;
  add: (collectionId: string, entries: readonly CollectionSubject[]) => Promise<number | null>;
  move: (collectionId: string, entryId: string, afterEntryId: string | null) => Promise<boolean>;
  drop: (collectionId: string, entryId: string) => Promise<boolean>;
  readArtwork: (collectionId: string) => Promise<CollectionArtwork | null>;
  saveArtwork: (
    collectionId: string,
    artwork: CollectionArtwork,
  ) => Promise<PictureFault | 'missing' | null>;
  dropArtwork: (collectionId: string) => Promise<boolean>;
};

export type {
  CollectionArtwork,
  CollectionChange,
  CollectionReading,
  CollectionService,
  NewCollection,
};
