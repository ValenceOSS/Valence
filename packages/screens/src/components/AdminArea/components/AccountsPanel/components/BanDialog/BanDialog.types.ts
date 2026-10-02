type BanDialogProps = {
  name: string | null;
  onClose: () => void;
  onBan: (reason: string) => void;
};

export type { BanDialogProps };
