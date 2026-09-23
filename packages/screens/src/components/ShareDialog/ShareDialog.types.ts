import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';

type ShareDialogProps = {
  subject: ShareSubject | null;
  isOpen: boolean;
  onClose: () => void;
  origin?: string;
};

export type { ShareDialogProps };
