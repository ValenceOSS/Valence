import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type DownloadClientRecord = Omit<DownloadClient, 'hasPassword' | 'hasApiKey'> & {
  password: string;
  apiKey: string;
};

type DownloadClientStore = RecordStore<DownloadClientRecord>;

export type { DownloadClientRecord, DownloadClientStore };
