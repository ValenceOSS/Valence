import type { IndexerDefinitionSummary } from '@ValenceContracts/schemas/IndexerDefinition';

type DefinitionRecord = IndexerDefinitionSummary & { yaml: string; sha: string; fetchedAt: string };

type CatalogueState = { updatedAt: string | null; problem: string | null };

type DefinitionStore = {
  list: () => Promise<(IndexerDefinitionSummary & { sha: string })[]>;
  get: (id: string) => Promise<DefinitionRecord | null>;
  save: (records: readonly DefinitionRecord[]) => Promise<void>;
  remove: (ids: readonly string[]) => Promise<void>;
  readState: () => Promise<CatalogueState>;
  writeState: (state: CatalogueState) => Promise<void>;
};

export type { CatalogueState, DefinitionRecord, DefinitionStore };
