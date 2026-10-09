type AShowProps = {
  libraryId: string;
  showId: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onBack: () => void;
  onRequestMore?: (tmdbId: number) => void;
};

export type { AShowProps };
