import { describe, expect, it } from 'vitest';
import {
  A_NEW_CLIENT,
  choosingKind,
  choosingPluginClient,
  formFor,
  keyOfPluginClient,
} from './readDownloadClientForm';
import type { OfferedClient } from './readDownloadClientForm';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';

const KEPT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Seedbox',
  kind: 'transmission',
  plugin: null,
  url: 'http://seedbox:9091',
  username: 'me',
  hasPassword: true,
  hasApiKey: false,
  remotePath: '',
  localPath: '',
  categories: { movies: 'films', shows: 'tv', music: 'music', books: 'books' },
  priority: 3,
  isEnabled: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('formFor', () => {
  it('opens on a qBittorrent at its usual address for a new client', () => {
    expect(formFor(null)).toEqual(A_NEW_CLIENT);
    expect(A_NEW_CLIENT).toMatchObject({ name: 'qBittorrent', url: 'http://qbittorrent:8080' });
  });

  it('opens on a kept client, with its password left for somebody to type', () => {
    expect(formFor(KEPT)).toEqual({
      kind: 'transmission',
      plugin: null,
      name: 'Seedbox',
      url: 'http://seedbox:9091',
      username: 'me',
      password: '',
      apiKey: '',
      categories: { movies: 'films', shows: 'tv', music: 'music', books: 'books' },
      remotePath: '',
      localPath: '',
      priority: '3',
      isEnabled: false,
    });
  });
});

describe('choosingKind', () => {
  it('brings the kind’s name and usual address in place of the last kind’s', () => {
    expect(choosingKind(A_NEW_CLIENT, 'sabnzbd')).toEqual({
      kind: 'sabnzbd',
      plugin: null,
      name: 'SABnzbd',
      url: 'http://sabnzbd:8080',
    });
    expect(choosingKind({ ...A_NEW_CLIENT, name: ' ', url: '' }, 'nzbget')).toEqual({
      kind: 'nzbget',
      plugin: null,
      name: 'NZBGet',
      url: 'http://nzbget:6789',
    });
  });

  it('keeps a name and address somebody typed', () => {
    expect(
      choosingKind(
        { ...A_NEW_CLIENT, name: 'Seedbox', url: 'http://seedbox:9091' },
        'transmission',
      ),
    ).toEqual({
      kind: 'transmission',
      plugin: null,
      name: 'Seedbox',
      url: 'http://seedbox:9091',
    });
  });

  it('clears the usual name and address for a plugin’s client, which has neither', () => {
    expect(choosingKind(A_NEW_CLIENT, 'plugin')).toEqual({
      kind: 'plugin',
      plugin: null,
      name: '',
      url: '',
    });
    expect(
      choosingKind({ ...A_NEW_CLIENT, name: 'Seedbox', url: 'http://seedbox:9091' }, 'plugin'),
    ).toMatchObject({ name: 'Seedbox', url: 'http://seedbox:9091' });
  });
});

const OFFERED: OfferedClient[] = [
  {
    pluginId: 'example-files',
    pluginName: 'Example files',
    clientId: 'files',
    title: 'Example files',
    protocol: 'torrent',
  },
  {
    pluginId: 'other',
    pluginName: 'Other',
    clientId: 'news',
    title: 'Other news',
    protocol: 'usenet',
  },
];

describe('choosingKind, from a plugin’s client', () => {
  it('drops the name the plugin’s client brought when going back to a built-in client', () => {
    expect(
      choosingKind(
        { ...A_NEW_CLIENT, kind: 'plugin', name: 'Example files', url: '' },
        'qbittorrent',
        OFFERED,
      ),
    ).toMatchObject({ name: 'qBittorrent', url: 'http://qbittorrent:8080' });
  });
});

describe('choosingPluginClient', () => {
  it('names the plugin’s client and takes its name, unless somebody typed one', () => {
    const form = { ...A_NEW_CLIENT, kind: 'plugin' as const, name: '' };

    expect(choosingPluginClient(form, OFFERED, 'other/news')).toEqual({
      plugin: { id: 'other', clientId: 'news', protocol: 'usenet' },
      name: 'Other news',
    });
    expect(
      choosingPluginClient({ ...form, name: 'Other news' }, OFFERED, 'example-files/files'),
    ).toMatchObject({ name: 'Example files' });
    expect(
      choosingPluginClient({ ...form, name: 'Mine' }, OFFERED, 'example-files/files'),
    ).toMatchObject({ name: 'Mine' });
  });

  it('names no plugin for one no longer offered', () => {
    expect(choosingPluginClient({ ...A_NEW_CLIENT, name: 'Mine' }, OFFERED, 'gone/files')).toEqual({
      plugin: null,
      name: 'Mine',
    });
  });
});

describe('keyOfPluginClient', () => {
  it('lists a plugin’s client by the plugin and the client together', () => {
    expect(keyOfPluginClient({ id: 'example-files', clientId: 'files' })).toBe(
      'example-files/files',
    );
  });
});
