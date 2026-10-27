import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import type {
  DownloadCategories,
  DownloadClient,
  DownloadClientKind,
  DownloadClientPlugin,
} from '@ValenceContracts/schemas/DownloadClient';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

type DownloadClientForm = {
  kind: DownloadClientKind;
  plugin: DownloadClientPlugin | null;
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

type OfferedClient = PluginContributions['downloadClients'][number];

const A_NEW_CLIENT: DownloadClientForm = {
  kind: 'qbittorrent',
  plugin: null,
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
 * it — unless somebody has already typed their own, which is kept. A name a plugin's client
 * brought with it counts as nobody's own.
 *
 * @param form - The form as it stands.
 * @param kind - The kind chosen.
 * @param offered - The download clients plugins offer.
 * @returns The changes to make.
 */
const choosingKind = (
  form: DownloadClientForm,
  kind: DownloadClientKind,
  offered: readonly OfferedClient[] = [],
): Pick<DownloadClientForm, 'kind' | 'plugin' | 'name' | 'url'> => {
  const chosen = CLIENT_KINDS.find((one) => one.id === kind);
  const isUntouched = (value: string, field: 'label' | 'address') =>
    value.trim() === '' ||
    CLIENT_KINDS.some((one) => one[field] === value.trim()) ||
    (field === 'label' && offered.some((one) => one.title === value.trim()));

  if (chosen === undefined) {
    return {
      kind,
      plugin: null,
      name: isUntouched(form.name, 'label') ? '' : form.name,
      url: isUntouched(form.url, 'address') ? '' : form.url,
    };
  }

  return {
    kind,
    plugin: null,
    name: isUntouched(form.name, 'label') ? chosen.label : form.name,
    url: isUntouched(form.url, 'address') ? chosen.address : form.url,
  };
};

/**
 * The id a plugin's download client is listed under.
 *
 * @param plugin - The plugin and the client it offers.
 * @returns The id.
 */
const keyOfPluginClient = (plugin: Pick<DownloadClientPlugin, 'id' | 'clientId'>): string =>
  `${plugin.id}/${plugin.clientId}`;

/**
 * Chooses which plugin's download client the form is for, bringing its name with it — unless
 * somebody has already typed their own, which is kept.
 *
 * @param form - The form as it stands.
 * @param offered - The download clients plugins offer.
 * @param key - The one chosen, by its id.
 * @returns The changes to make.
 */
const choosingPluginClient = (
  form: DownloadClientForm,
  offered: readonly OfferedClient[],
  key: string,
): Pick<DownloadClientForm, 'plugin' | 'name'> => {
  const chosen = offered.find(
    (one) => keyOfPluginClient({ id: one.pluginId, clientId: one.clientId }) === key,
  );

  if (chosen === undefined) {
    return { plugin: null, name: form.name };
  }

  const isUntouched =
    form.name.trim() === '' || offered.some((one) => one.title === form.name.trim());

  return {
    plugin: { id: chosen.pluginId, clientId: chosen.clientId, protocol: chosen.protocol },
    name: isUntouched ? chosen.title : form.name,
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
        plugin: client.plugin,
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

export type { DownloadClientForm, OfferedClient };

export {
  A_NEW_CLIENT,
  CLIENT_KINDS,
  choosingKind,
  choosingPluginClient,
  formFor,
  keyOfPluginClient,
};
