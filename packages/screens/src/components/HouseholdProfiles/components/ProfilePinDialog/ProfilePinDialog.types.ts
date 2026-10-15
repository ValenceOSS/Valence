type ProfilePinDialogProps = {
  name: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pin: string) => Promise<boolean>;
};

export type { ProfilePinDialogProps };
