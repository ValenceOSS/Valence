type ATitleProps = {
  mediaId: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAtPerson: (personId: number) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onBack: () => void;
};

export type { ATitleProps };
