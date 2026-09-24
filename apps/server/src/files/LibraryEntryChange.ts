import type { DiskRefusal } from '@ValenceServer/files/diskRefusalOf';

type LibraryEntryChange =
  | { kind: 'changed'; path: string; libraryIds: string[] }
  | { kind: 'outside' }
  | { kind: 'root' }
  | { kind: 'exists' }
  | { kind: 'badName' }
  | { kind: 'intoItself' }
  | { kind: 'otherDisk' }
  | DiskRefusal;

export type { LibraryEntryChange };
