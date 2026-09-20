import type { ComponentProps, ReactNode } from 'react';
import type { Dialog } from '@ValenceUI/Dialog';

type DialogCompanionProps = {
  label: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ComponentProps<typeof Dialog>['size'];
};

export type { DialogCompanionProps };
