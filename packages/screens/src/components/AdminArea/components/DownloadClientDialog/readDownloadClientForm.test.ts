import { describe, expect, it } from 'vitest';
import { A_NEW_CLIENT, choosingKind, formFor } from './readDownloadClientForm';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';

const KEPT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Seedbox',
  kind: 'transmission',
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
      name: 'SABnzbd',
      url: 'http://sabnzbd:8080',
    });
    expect(choosingKind({ ...A_NEW_CLIENT, name: ' ', url: '' }, 'nzbget')).toEqual({
      kind: 'nzbget',
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
    ).toEqual({ kind: 'transmission', name: 'Seedbox', url: 'http://seedbox:9091' });
  });
});
