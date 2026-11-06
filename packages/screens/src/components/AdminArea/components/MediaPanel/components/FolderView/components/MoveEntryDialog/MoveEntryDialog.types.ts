type MoveEntryDialogProps = {
  name: string | null;
  start: string;
  onClose: () => void;
  onMove: (into: string) => void;
};

export type { MoveEntryDialogProps };
