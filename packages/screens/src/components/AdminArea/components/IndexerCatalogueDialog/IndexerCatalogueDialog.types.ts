import type { IndexerStart } from '@ValenceScreens/components/AdminArea/IndexerStart';

type IndexerCatalogueDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (start: IndexerStart) => void;
};

export type { IndexerCatalogueDialogProps };
