import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientState } from '@ValenceContracts/schemas/DownloadQueue';

type DownloadClientsTableProps = {
  clients: readonly DownloadClient[];
  readings: readonly DownloadClientState[];
  testingId: string | null;
  onChange: (client: DownloadClient) => void;
  onTest: (client: DownloadClient) => void;
  onSwitch: (client: DownloadClient) => void;
  onRemove: (client: DownloadClient) => void;
};

export type { DownloadClientsTableProps };
