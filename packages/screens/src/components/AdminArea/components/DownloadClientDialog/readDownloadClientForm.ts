import { readWholeNumber } from '@ValenceCore/functions/readWholeNumber';
import type {
  DownloadClient,
  DownloadClientDraft,
  DownloadClientKind,
} from '@ValenceContracts/schemas/DownloadClient';

type DownloadClientForm = {
  kind: DownloadClientKind;
  name: string;
  url: string;
  username: string;
  password: string;
  apiKey: string;
  category: string;
  priority: string;
  isEnabled: boolean;
};

type ReadDownloadClientForm =
  { draft: DownloadClientDraft; problem: null } | { draft: null; problem: string };

const A_NEW_CLIENT: DownloadClientForm = {
  kind: 'qbittorrent',
  name: '',
  url: '',
  username: '',
  password: '',
  apiKey: '',
  category: 'valence',
  priority: '25',
  isEnabled: true,
};

/**
 * The form as it opens: empty for a new client, or on one already kept. A password or key is never
 * sent back, so its field starts empty and stays that way unless somebody types a new one.
 *
 * @param client - The client being changed, where it is one.
 * @returns The form.
 */
const formFor = (client: DownloadClient | null): DownloadClientForm =>
  client === null
    ? A_NEW_CLIENT
    : {
        kind: client.kind,
        name: client.name,
        url: client.url,
        username: client.username,
        password: '',
        apiKey: '',
        category: client.category,
        priority: client.priority.toString(),
        isEnabled: client.isEnabled,
      };

/**
 * Reads the form into a client to keep or try, or says the first thing wrong with it in words that
 * point at the field. SABnzbd is reached with its API key; every other client with a username and
 * password, so only what the kind uses is sent.
 *
 * @param form - The form as it stands.
 * @returns The client, or what is wrong.
 */
const readDownloadClientForm = (form: DownloadClientForm): ReadDownloadClientForm => {
  const name = form.name.trim();
  const url = form.url.trim();
  const category = form.category.trim();

  if (name === '') {
    return { draft: null, problem: 'Give the client a name.' };
  }

  if (!URL.canParse(url) || !/^https?:$/.test(new URL(url).protocol)) {
    return { draft: null, problem: 'The address needs to be a whole http or https address.' };
  }

  if (!/^[\w .-]+$/.test(category)) {
    return {
      draft: null,
      problem: 'The category is letters, numbers, spaces, dots, dashes and underscores.',
    };
  }

  const priority = readWholeNumber(form.priority, 1, 50);

  if (priority === null) {
    return { draft: null, problem: 'Priority is a whole number from 1 to 50.' };
  }

  const isSabnzbd = form.kind === 'sabnzbd';

  return {
    draft: {
      kind: form.kind,
      name,
      url,
      username: isSabnzbd ? '' : form.username.trim(),
      password: isSabnzbd ? '' : form.password,
      apiKey: isSabnzbd ? form.apiKey.trim() : '',
      category,
      priority,
      isEnabled: form.isEnabled,
    },
    problem: null,
  };
};

export type { DownloadClientForm };

export { A_NEW_CLIENT, formFor, readDownloadClientForm };
