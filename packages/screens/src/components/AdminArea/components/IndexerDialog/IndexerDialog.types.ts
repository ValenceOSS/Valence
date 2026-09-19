import type { Indexer } from '@ValenceContracts/schemas/Indexer';

type IndexerDialogProps = {
  isOpen: boolean;
  indexer: Indexer | null;
  onClose: () => void;
  onSaved: (indexer: Indexer) => void;
};

export type { IndexerDialogProps };
