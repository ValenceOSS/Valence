type RefreshTitleDialogProps = {
  mediaId: string;
  name: string;
  kind: 'film' | 'show';
  isMatched: boolean;
  isOpen: boolean;
  onClose: () => void;
  onStarted: (jobId: string | null) => void;
};

export type { RefreshTitleDialogProps };
