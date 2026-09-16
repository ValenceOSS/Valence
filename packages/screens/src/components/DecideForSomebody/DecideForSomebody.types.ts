import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type DecideForSomebodyProps = {
  about: MediaSummary | null;
  onClose: () => void;
};

export type { DecideForSomebodyProps };
