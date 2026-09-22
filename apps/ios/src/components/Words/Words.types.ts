import type { ReactNode } from 'react';

type WordsProps = {
  children: ReactNode;
  tone?: 'plain' | 'muted' | 'danger' | 'accent';
  size?: 'title' | 'heading' | 'body' | 'small';
  lines?: number;
};

export type { WordsProps };
