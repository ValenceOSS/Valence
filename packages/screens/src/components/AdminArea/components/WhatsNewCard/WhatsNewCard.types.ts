import type { Library } from '@ValenceContracts/schemas/Library';

type WhatsNewCardProps = {
  libraries: readonly Library[];
  onOpenPanel: (panel: string) => void;
};

export type { WhatsNewCardProps };
