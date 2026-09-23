import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';

type TheDownloadsProps = {
  onWatch: (file: HeldFile) => void;
  onBack?: () => void;
};

export type { TheDownloadsProps };
