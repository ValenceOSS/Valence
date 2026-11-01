type RenameDeviceDialogProps = {
  ownName: string;
  renamed: string | null;
  isOpen: boolean;
  onRename: (name: string | null) => Promise<void>;
  onClose: () => void;
};

export type { RenameDeviceDialogProps };
