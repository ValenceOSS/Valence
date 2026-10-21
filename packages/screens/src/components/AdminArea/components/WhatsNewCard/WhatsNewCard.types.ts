import type { Library } from '@ValenceContracts/schemas/Library';

type WhatsNewCardProps = {
  libraries: readonly Library[];
  isReadingLibraries?: boolean;
  onOpenPanel: (panel: string) => void;
};

export type { WhatsNewCardProps };
