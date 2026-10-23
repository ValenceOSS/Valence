import type { Indexer } from '@ValenceContracts/schemas/Indexer';

type IndexerChoiceCardProps = {
  indexers: readonly Pick<Indexer, 'id' | 'name' | 'libraryIds'>[];
  libraryId: string;
  chosen: readonly string[] | null;
  onChange: (chosen: string[] | null) => void;
  isBusy: boolean;
};

export type { IndexerChoiceCardProps };
