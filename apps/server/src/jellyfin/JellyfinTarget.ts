import type { Library } from '@ValenceContracts/schemas/Library';

type JellyfinTarget =
  | { kind: 'library'; library: Library }
  | { kind: 'show'; libraryId: string; showId: string }
  | { kind: 'season'; libraryId: string; showId: string; seasonNumber: number | null }
  | { kind: 'media'; mediaId: string }
  | { kind: 'person'; personId: number };

export type { JellyfinTarget };
