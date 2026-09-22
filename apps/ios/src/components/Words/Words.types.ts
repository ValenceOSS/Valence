import type { ReactNode } from 'react';

type WordsProps = {
  children: ReactNode;
  tone?: 'plain' | 'muted' | 'danger' | 'accent' | 'onArtwork' | 'onBright';
  size?: 'title' | 'heading' | 'body' | 'small';
  lines?: number;
};

export type { WordsProps };
