import type { ReactNode } from 'react';

type MusicTitleDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export type { MusicTitleDialogProps };
