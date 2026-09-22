type TheLibraryProps = {
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onOut: () => void;
};

export type { TheLibraryProps };
