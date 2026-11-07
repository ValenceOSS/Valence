import type { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  description?: string;
  aside?: ReactNode;
  isLabelHidden?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
};

export type { FormFieldProps };
