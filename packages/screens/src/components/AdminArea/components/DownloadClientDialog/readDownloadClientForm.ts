import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import type {
  DownloadCategories,
  DownloadClient,
  DownloadClientKind,
} from '@ValenceContracts/schemas/DownloadClient';
import { say } from '@ValenceI18n/say';

type DownloadClientForm = {
  kind: DownloadClientKind;
  name: string;
  url: string;
  username: string;
  password: string;
  apiKey: string;
  categories: DownloadCategories;
  remotePath: string;
  localPath: string;
  priority: string;
  isEnabled: boolean;
};

const CLIENT_KINDS = [
  {
    id: 'qbittorrent',
    label: say('screens.downloadClientDialog.readDownloadClientForm.qBittorrent'),
    address: 'http://qbittorrent:8080',
  },
  { id: 'transmission', label: say('common.transmission'), address: 'http://transmission:9091' },
  {
    id: 'sabnzbd',
    label: say('screens.downloadClientDialog.readDownloadClientForm.sABnzbd'),
    address: 'http://sabnzbd:8080',
  },
  {
    id: 'nzbget',
    label: say('screens.downloadClientDialog.readDownloadClientForm.nZBGet'),
    address: 'http://nzbget:6789',
  },
] as const satisfies readonly { id: DownloadClientKind; label: string; address: string }[];

const A_NEW_CLIENT: DownloadClientForm = {
  kind: 'qbittorrent',
  name: 'qBittorrent',
  url: 'http://qbittorrent:8080',
  username: '',
  password: '',
  apiKey: '',
  categories: DEFAULT_DOWNLOAD_CATEGORIES,
  remotePath: '',
  localPath: '',
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
        categories: client.categories,
        remotePath: client.remotePath,
        localPath: client.localPath,
        priority: client.priority.toString(),
        isEnabled: client.isEnabled,
      };

export type { DownloadClientForm };

export { A_NEW_CLIENT, CLIENT_KINDS, choosingKind, formFor };
