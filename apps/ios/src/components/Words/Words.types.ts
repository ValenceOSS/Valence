import type { ReactNode } from 'react';

type WordsProps = {
  children: ReactNode;
  tone?: 'plain' | 'muted' | 'danger' | 'accent' | 'onArtwork' | 'onBright';
  size?: 'title' | 'heading' | 'body' | 'small';
  lines?: number;
  isSelectable?: boolean;
  isCentred?: boolean;
  isProse?: boolean;
  isStrong?: boolean;
};

export type { WordsProps };
