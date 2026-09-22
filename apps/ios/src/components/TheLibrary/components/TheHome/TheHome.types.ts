import type { ReactNode } from 'react';

type TheHomeProps = {
  header: ReactNode;
  watchable: readonly string[];
  onLookAt: (mediaId: string) => void;
  onLookAtShow: (libraryId: string, showId: string) => void;
};

export type { TheHomeProps };
