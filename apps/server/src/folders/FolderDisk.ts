type FolderEntry = {
  name: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
};

type DirectoryRead =
  { kind: 'read'; entries: FolderEntry[] } | { kind: 'missing' } | { kind: 'unreadable' };

type DirectoryMade = 'made' | 'exists' | 'missing' | 'readOnly' | 'denied';

type FolderDisk = {
  readDirectory: (path: string) => Promise<DirectoryRead>;
  isDirectory: (path: string) => Promise<boolean>;
  makeDirectory: (path: string) => Promise<DirectoryMade>;
  roots: () => Promise<string[]>;
};

export type { DirectoryMade, DirectoryRead, FolderDisk, FolderEntry };
