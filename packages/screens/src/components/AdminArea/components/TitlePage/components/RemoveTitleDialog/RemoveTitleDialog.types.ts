type RemoveTitleDialogProps = {
  title: string | null;
  isRemoving: boolean;
  onClose: () => void;
  onRemove: (isDeletingFiles: boolean) => void;
};

export type { RemoveTitleDialogProps };
