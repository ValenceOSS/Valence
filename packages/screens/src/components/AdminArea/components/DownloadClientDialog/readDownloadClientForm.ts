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

const CLIENT_KINDS = [
  { id: 'qbittorrent', label: 'qBittorrent', address: 'http://qbittorrent:8080' },
  { id: 'transmission', label: 'Transmission', address: 'http://transmission:9091' },
  { id: 'sabnzbd', label: 'SABnzbd', address: 'http://sabnzbd:8080' },
  { id: 'nzbget', label: 'NZBGet', address: 'http://nzbget:6789' },
] as const satisfies readonly { id: DownloadClientKind; label: string; address: string }[];

const A_NEW_CLIENT: DownloadClientForm = {
  kind: 'qbittorrent',
  name: 'qBittorrent',
  url: 'http://qbittorrent:8080',
  username: '',
  password: '',
  apiKey: '',
  category: 'valence',
  priority: '25',
  isEnabled: true,
};

/**
 * Changes which kind of client the form is for, bringing that kind's name and usual address with
 * it — unless somebody has already typed their own, which is kept.
 *
 * @param form - The form as it stands.
 * @param kind - The kind chosen.
 * @returns The changes to make.
 */
const choosingKind = (
  form: DownloadClientForm,
  kind: DownloadClientKind,
): Pick<DownloadClientForm, 'kind' | 'name' | 'url'> => {
  const chosen = CLIENT_KINDS.find((one) => one.id === kind);
  const isUntouched = (value: string, field: 'label' | 'address') =>
    value.trim() === '' || CLIENT_KINDS.some((one) => one[field] === value.trim());

  return {
    kind,
    name: chosen !== undefined && isUntouched(form.name, 'label') ? chosen.label : form.name,
    url: chosen !== undefined && isUntouched(form.url, 'address') ? chosen.address : form.url,
  };
};

/**
 * The form as it opens: a qBittorrent at its usual address for a new client, or one already kept. A password or key is never
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

export { A_NEW_CLIENT, CLIENT_KINDS, choosingKind, formFor, readDownloadClientForm };
