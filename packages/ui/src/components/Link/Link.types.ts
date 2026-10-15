import type { FocusEvent, ReactNode } from 'react';

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
  look?: 'text' | 'bare';
  label?: string;
  isCurrent?: boolean;
  onPointerEnter?: () => void;
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
};

export type { LinkProps };
