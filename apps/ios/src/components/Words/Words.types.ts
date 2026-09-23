import type { ReactNode } from 'react';

type WordsProps = {
  children: ReactNode;
  tone?: 'plain' | 'muted' | 'danger' | 'accent' | 'onArtwork' | 'onBright' | 'onAccent';
  size?: 'title' | 'heading' | 'body' | 'small';
  lines?: number;
  isSelectable?: boolean;
  isCentred?: boolean;
  isProse?: boolean;
  isStrong?: boolean;
  colour?: string;
};

export type { WordsProps };
