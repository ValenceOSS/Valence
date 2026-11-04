import type { ReactNode } from 'react';

type SourceRowProps = {
  title: string;
  description: ReactNode;
  isSet: boolean;
  freeKeyAt: string;
  fields: ReactNode;
  canSave: boolean;
  isSaving: boolean;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
};

export type { SourceRowProps };
