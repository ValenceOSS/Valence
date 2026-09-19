import type { RecordStore } from '@ValenceRequests/stores/RecordStore';
import type { Indexer, IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';

type IndexerRecord = Omit<Indexer, 'hasApiKey' | 'settings' | 'secretsSet' | 'privacy'> & {
  apiKey: string;
  settings: IndexerSettings;
  session: SiteSession | null;
};

type IndexerStore = RecordStore<IndexerRecord>;

export type { IndexerRecord, IndexerStore };
