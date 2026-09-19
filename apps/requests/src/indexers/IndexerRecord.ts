import type { Indexer } from '@ValenceContracts/schemas/Indexer';

type IndexerRecord = Omit<Indexer, 'hasApiKey'> & { apiKey: string };

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
