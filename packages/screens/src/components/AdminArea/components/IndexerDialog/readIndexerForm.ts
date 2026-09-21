import { readWholeNumber } from '@ValenceCore/functions/readWholeNumber';
import type {
  Indexer,
  IndexerDraft,
  IndexerKind,
  IndexerSettings,
} from '@ValenceContracts/schemas/Indexer';
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

type ReadIndexerForm = { draft: IndexerDraft; problem: null } | { draft: null; problem: string };

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

/**
 * Reads the indexer form into an indexer to keep or try, or says the first thing wrong with it in
 * words that point at the field.
 *
 * @param form - The form as it stands.
 * @returns The indexer, or what is wrong.
 */
const readIndexerForm = (form: IndexerForm): ReadIndexerForm => {
  const name = form.name.trim();
  const url = form.url.trim();

  if (name === '') {
    return { draft: null, problem: 'Give the indexer a name.' };
  }

  if (!URL.canParse(url) || !/^https?:$/.test(new URL(url).protocol)) {
    return { draft: null, problem: 'The address needs to be a whole http or https address.' };
  }

  const priority = readWholeNumber(form.priority, 1, 50);

  if (priority === null) {
    return { draft: null, problem: 'Priority is a whole number from 1 to 50.' };
  }

  const perMinute =
    form.requestsPerMinute.trim() === '' ? null : readWholeNumber(form.requestsPerMinute, 1, 600);

  if (perMinute === null && form.requestsPerMinute.trim() !== '') {
    return { draft: null, problem: 'The limit is a whole number of searches a minute, up to 600.' };
  }

  const timeout = readWholeNumber(form.timeoutSeconds, 5, 120);

  if (timeout === null) {
    return { draft: null, problem: 'Wait between 5 and 120 seconds for an answer.' };
  }

  const seedSeconds =
    form.seedSeconds.trim() === '' ? null : readWholeNumber(form.seedSeconds, 0, 31_536_000);

  if (seedSeconds === null && form.seedSeconds.trim() !== '') {
    return { draft: null, problem: 'Seed time is a whole number of seconds, up to a year.' };
  }

  const ratio = form.seedRatio.trim() === '' ? null : Number(form.seedRatio.trim());

  if (ratio !== null && (!Number.isFinite(ratio) || ratio < 0 || ratio > 1000)) {
    return { draft: null, problem: 'A ratio is a number from 0 to 1000.' };
  }

  return {
    draft: {
      kind: form.kind,
      name,
      url,
      apiKey: form.apiKey.trim(),
      priority,
      requestsPerMinute: perMinute,
      timeoutSeconds: timeout,
      isEnabled: form.isEnabled,
      categories: form.categories,
      definitionId: form.kind === 'cardigann' ? form.definitionId : null,
      settings: form.kind === 'cardigann' ? form.settings : {},
      removesWhenDone:
        form.removesWhenDone === 'tracker' ? null : form.removesWhenDone === 'always',
      seedSeconds,
      seedRatio: ratio,
    },
    problem: null,
  };
};

export type { IndexerForm };

export { A_NEW_INDEXER, formFor, readIndexerForm };
