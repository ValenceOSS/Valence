import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type PersonPageProps = {
  personId: number;
  onOpen: (media: MediaSummary) => void;
  onLight: (path: string | null) => void;
};

export type { PersonPageProps };
