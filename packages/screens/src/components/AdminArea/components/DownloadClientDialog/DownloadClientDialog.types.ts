import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';

type DownloadClientDialogProps = {
  isOpen: boolean;
  client: DownloadClient | null;
  onClose: () => void;
  onSaved: (client: DownloadClient) => void;
};

export type { DownloadClientDialogProps };
