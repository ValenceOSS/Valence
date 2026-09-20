import type { Indexer } from '@ValenceContracts/schemas/Indexer';
import type { IndexerStart } from '@ValenceScreens/components/AdminArea/IndexerStart';

type IndexerDialogProps = {
  isOpen: boolean;
  indexer: Indexer | null;
  start?: IndexerStart | null;
  onClose: () => void;
  onBack?: () => void;
  onSaved: (indexer: Indexer) => void;
};

export type { IndexerDialogProps };
