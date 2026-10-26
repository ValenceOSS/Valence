type ATitleProps = {
  mediaId: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtPerson: (personId: number) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onBack: () => void;
  onStartParty?: (mediaId: string, startSeconds: number) => void;
};

export type { ATitleProps };
