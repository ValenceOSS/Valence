import type { Indexer, IndexerKind, IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import type { IndexerStart } from '@ValenceScreens/components/AdminArea/IndexerStart';

type IndexerForm = {
  kind: IndexerKind;
  name: string;
  url: string;
  apiKey: string;
  priority: string;
  requestsPerMinute: string;
  timeoutSeconds: string;
  isEnabled: boolean;
  categories: number[];
  definitionId: string | null;
  settings: IndexerSettings;
  removesWhenDone: 'tracker' | 'always' | 'never';
  seedSeconds: string;
  seedRatio: string;
};

const A_NEW_INDEXER: IndexerForm = {
  kind: 'torznab',
  name: '',
  url: '',
  apiKey: '',
  priority: '25',
  requestsPerMinute: '',
  timeoutSeconds: '30',
  isEnabled: true,
  categories: [],
  definitionId: null,
  settings: {},
  removesWhenDone: 'tracker',
  seedSeconds: '',
  seedRatio: '',
};

/**
 * The form as it opens: on an indexer already kept, or on what was chosen to add. A key is never
 * sent back, so its field starts empty and stays that way unless somebody types a new one; a site
 * chosen from the catalogue starts with its own name, and its address once its definition arrives.
 *
 * @param indexer - The indexer being changed, where it is one.
 * @param start - What was chosen to add, where it is a new one.
 * @returns The form.
 */
const formFor = (indexer: Indexer | null, start: IndexerStart | null = null): IndexerForm => {
  if (indexer === null) {
    return start === null
      ? A_NEW_INDEXER
      : start.kind === 'cardigann'
        ? {
            ...A_NEW_INDEXER,
            kind: 'cardigann',
            name: start.name,
            definitionId: start.definitionId,
          }
        : { ...A_NEW_INDEXER, kind: start.kind };
  }

  return {
    kind: indexer.kind,
    name: indexer.name,
    url: indexer.url,
    apiKey: '',
    priority: indexer.priority.toString(),
    requestsPerMinute: indexer.requestsPerMinute?.toString() ?? '',
    timeoutSeconds: indexer.timeoutSeconds.toString(),
    isEnabled: indexer.isEnabled,
    categories: indexer.categories,
    definitionId: indexer.definitionId,
    settings: indexer.settings,
    removesWhenDone:
      indexer.removesWhenDone === null ? 'tracker' : indexer.removesWhenDone ? 'always' : 'never',
    seedSeconds: indexer.seedSeconds?.toString() ?? '',
    seedRatio: indexer.seedRatio?.toString() ?? '',
  };
};

export type { IndexerForm };

export { A_NEW_INDEXER, formFor };
