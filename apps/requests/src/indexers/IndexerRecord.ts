import type { Indexer, IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';

type IndexerRecord = Omit<Indexer, 'hasApiKey' | 'settings' | 'secretsSet' | 'privacy'> & {
  apiKey: string;
  settings: IndexerSettings;
  session: SiteSession | null;
};

type IndexerStore = {
  list: () => Promise<IndexerRecord[]>;
  find: (id: string) => Promise<IndexerRecord | null>;
  insert: (record: IndexerRecord) => Promise<IndexerRecord>;
  update: (
    id: string,
    changes: Partial<Omit<IndexerRecord, 'id'>>,
  ) => Promise<IndexerRecord | null>;
  remove: (id: string) => Promise<boolean>;
};

export type { IndexerRecord, IndexerStore };
