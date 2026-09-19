type RequestedAlbumStore = {
  findByReleaseGroup: (libraryId: string, releaseGroupId: string) => Promise<string | null>;
  findUnder: (libraryId: string, folder: string) => Promise<string | null>;
  setReleaseGroup: (albumId: string, releaseGroupId: string) => Promise<void>;
};

export type { RequestedAlbumStore };
