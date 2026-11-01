import type { ReactNode } from 'react';

type AMusicHeadProps = {
  kind: string;
  detail: string | null;
  about?: string | null;
  canPlay: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  children?: ReactNode;
};

export type { AMusicHeadProps };
