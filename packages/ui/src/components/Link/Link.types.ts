import type { ReactNode } from 'react';

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
  look?: 'text' | 'bare';
  label?: string;
};

export type { LinkProps };
