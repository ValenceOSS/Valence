import type { ReactNode } from 'react';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';

type TheDownloadsProps = {
  onWatch: (file: HeldFile) => void;
  onBack?: () => void;
  header?: ReactNode;
  onScrolled?: (isScrolled: boolean) => void;
  searchingFor?: string;
};

export type { TheDownloadsProps };
