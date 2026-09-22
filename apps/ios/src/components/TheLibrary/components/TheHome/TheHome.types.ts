import type { ReactNode } from 'react';

type TheHomeProps = {
  header: ReactNode;
  watchable: readonly string[];
  onWatch: (mediaId: string, startSeconds: number) => void;
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { TheHomeProps };
