type KeptCopiesSubject = {
  mediaId: string;
  name: string;
};

type KeptCopiesDialogProps = {
  subject: KeptCopiesSubject | null;
  onClose: () => void;
};

export type { KeptCopiesDialogProps, KeptCopiesSubject };
