type NameEntryDialogProps = {
  isOpen: boolean;
  title: string;
  initialName: string;
  confirmLabel: string;
  onClose: () => void;
  onName: (name: string) => Promise<string | null>;
};

export type { NameEntryDialogProps };
