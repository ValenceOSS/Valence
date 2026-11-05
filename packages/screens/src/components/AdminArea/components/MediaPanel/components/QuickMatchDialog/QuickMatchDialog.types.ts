type QuickMatchTitle = { mediaId: string; name: string; year: number | null; kind: 'tv' | 'movie' };

type QuickMatchDialogProps = {
  titles: readonly QuickMatchTitle[] | null;
  onClose: () => void;
  onFixMatch: (mediaId: string) => void;
  onMatched: () => void;
};

export type { QuickMatchDialogProps, QuickMatchTitle };
