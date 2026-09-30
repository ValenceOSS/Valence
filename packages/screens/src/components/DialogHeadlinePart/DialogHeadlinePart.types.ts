import type { ReactNode } from 'react';

type DialogHeadlinePartProps = {
  children: ReactNode;
  as?: 'div' | 'h2' | 'span';
  isTitle?: boolean;
  className?: string;
};

export type { DialogHeadlinePartProps };
