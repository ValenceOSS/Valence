import type { ReactNode } from 'react';

type TrailerBackdropProps = {
  backdrop: ReactNode;
  trailerUrl: string | null;
  label: string;
  closing: ReactNode;
};

export type { TrailerBackdropProps };
