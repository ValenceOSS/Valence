type TheLibraryProps = {
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onNotifications: () => void;
};

export type { TheLibraryProps };
