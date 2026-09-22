type AShowProps = {
  libraryId: string;
  showId: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onBack: () => void;
};

export type { AShowProps };
