import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';

type AShareSheetProps = {
  subject: ShareSubject | null;
  onClose: () => void;
};

export type { AShareSheetProps };
