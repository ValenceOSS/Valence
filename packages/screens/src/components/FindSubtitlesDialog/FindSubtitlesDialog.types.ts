type FindSubtitlesDialogProps = {
  media: { id: string; name: string } | null;
  onClose: () => void;
  onFetched?: () => void;
};

export type { FindSubtitlesDialogProps };
