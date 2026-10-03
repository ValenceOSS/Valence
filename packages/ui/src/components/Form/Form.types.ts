import type { FormEvent, ReactNode } from 'react';

type FormProps = {
  label: string;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
  isDialog?: boolean;
  className?: string;
};

export type { FormProps };
