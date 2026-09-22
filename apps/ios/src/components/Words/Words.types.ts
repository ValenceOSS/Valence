import type { ReactNode } from 'react';

type WordsProps = {
  children: ReactNode;
  tone?: 'plain' | 'muted' | 'danger';
  size?: 'title' | 'body' | 'small';
  lines?: number;
};

export type { WordsProps };
