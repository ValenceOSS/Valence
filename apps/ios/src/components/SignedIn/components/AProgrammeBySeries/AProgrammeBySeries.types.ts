type AProgrammeBySeriesProps = {
  seriesId: string;
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onBack: () => void;
};

export type { AProgrammeBySeriesProps };
