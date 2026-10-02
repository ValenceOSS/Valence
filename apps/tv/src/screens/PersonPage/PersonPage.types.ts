import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type PersonPageProps = {
  personId: number;
  onOpen: (media: MediaSummary) => void;
};

export type { PersonPageProps };
