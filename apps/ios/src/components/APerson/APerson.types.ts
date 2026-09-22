type APersonProps = {
  personId: number;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
  onBack: () => void;
};

export type { APersonProps };
