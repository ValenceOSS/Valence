import type { ReactNode } from 'react';

type WordsProps = {
  children: ReactNode;
  tone?: 'plain' | 'muted' | 'danger' | 'accent' | 'onArtwork' | 'onBright' | 'onAccent';
  size?: 'title' | 'heading' | 'lead' | 'body' | 'small';
  lines?: number;
  isSelectable?: boolean;
  isCentred?: boolean;
  isProse?: boolean;
  isStrong?: boolean;
  colour?: string;
  onLines?: (count: number) => void;
};

export type { WordsProps };
