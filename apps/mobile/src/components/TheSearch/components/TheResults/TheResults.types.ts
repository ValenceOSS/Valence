type TheResultsProps = {
  asked: string;
  kind: 'films' | 'shows' | null;
  libraryIds: readonly string[];
  howFarThrough: (mediaId: string) => number;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { TheResultsProps };
