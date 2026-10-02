import type { ReactNode } from 'react';

type ThePlaceInTheSongProps = {
  title: string;
  onSeek: (to: number) => void;
  isFixed?: boolean;
  children?: ReactNode;
};

export type { ThePlaceInTheSongProps };
