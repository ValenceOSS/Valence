type APlayOnSheetProps = {
  media: { id: string; title: string } | null;
  startSeconds: number;
  onClose: () => void;
};

export type { APlayOnSheetProps };
