type PlayOnDialogProps = {
  media: { id: string; title: string } | null;
  startSeconds: number;
  onClose: () => void;
  onSent: () => void;
};

export type { PlayOnDialogProps };
