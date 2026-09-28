type AlbumCorrectingStore = {
  correctAlbum: (
    albumId: string,
    releaseGroupId: string,
    artworkPath: string | null,
  ) => Promise<boolean>;
  forgetAlbumCorrection: (albumId: string) => Promise<boolean>;
};

export type { AlbumCorrectingStore };
