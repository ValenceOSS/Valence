type ProfileNameDialogProps = {
  title: string;
  initialName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
};

export type { ProfileNameDialogProps };
