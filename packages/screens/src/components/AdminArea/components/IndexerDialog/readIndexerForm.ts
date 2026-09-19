import type { Indexer, IndexerDraft, IndexerKind } from '@ValenceContracts/schemas/Indexer';

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
};

/**
 * The form as it opens on an indexer already kept. The key is never sent back, so its field starts
 * empty and stays that way unless somebody types a new one.
 *
 * @param indexer - The indexer.
 * @returns The form.
 */
const formFor = (indexer: Indexer | null): IndexerForm =>
  indexer === null
    ? A_NEW_INDEXER
    : {
        kind: indexer.kind,
        name: indexer.name,
        url: indexer.url,
        apiKey: '',
        priority: indexer.priority.toString(),
        requestsPerMinute: indexer.requestsPerMinute?.toString() ?? '',
        timeoutSeconds: indexer.timeoutSeconds.toString(),
        isEnabled: indexer.isEnabled,
        categories: indexer.categories,
      };

/**
 * Reads a whole number typed into the form, within the range allowed.
 *
 * @param text - What was typed.
 * @param low - The least allowed.
 * @param high - The most allowed.
 * @returns The number, or null where it is not one in range.
 */
const wholeIn = (text: string, low: number, high: number): number | null => {
  const value = Number(text.trim());

  return text.trim() !== '' && Number.isInteger(value) && value >= low && value <= high
    ? value
    : null;
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

  const priority = wholeIn(form.priority, 1, 50);

  if (priority === null) {
    return { draft: null, problem: 'Priority is a whole number from 1 to 50.' };
  }

  const perMinute =
    form.requestsPerMinute.trim() === '' ? null : wholeIn(form.requestsPerMinute, 1, 600);

  if (perMinute === null && form.requestsPerMinute.trim() !== '') {
    return { draft: null, problem: 'The limit is a whole number of searches a minute, up to 600.' };
  }

  const timeout = wholeIn(form.timeoutSeconds, 5, 120);

  if (timeout === null) {
    return { draft: null, problem: 'Wait between 5 and 120 seconds for an answer.' };
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
    },
    problem: null,
  };
};

export type { IndexerForm };

export { A_NEW_INDEXER, formFor, readIndexerForm };
