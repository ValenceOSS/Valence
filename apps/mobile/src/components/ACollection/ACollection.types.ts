type ACollectionProps = {
  collectionId: string;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onBack: () => void;
};

export type { ACollectionProps };
