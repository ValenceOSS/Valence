import { describe, expect, it } from 'vitest';
import { A_NEW_CLIENT, formFor, readDownloadClientForm } from './readDownloadClientForm';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';

const KEPT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Seedbox',
  kind: 'transmission',
  url: 'http://seedbox:9091',
  username: 'me',
  hasPassword: true,
  hasApiKey: false,
  category: 'films',
  priority: 3,
  isEnabled: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const FILLED = { ...A_NEW_CLIENT, name: ' qBittorrent ', url: ' http://qbittorrent:8080 ' };

describe('formFor', () => {
  it('opens empty for a new client', () => {
    expect(formFor(null)).toEqual(A_NEW_CLIENT);
  });

  it('opens on a kept client, with its password left for somebody to type', () => {
    expect(formFor(KEPT)).toEqual({
      kind: 'transmission',
      name: 'Seedbox',
      url: 'http://seedbox:9091',
      username: 'me',
      password: '',
      apiKey: '',
      category: 'films',
      priority: '3',
      isEnabled: false,
    });
  });
});

describe('readDownloadClientForm', () => {
  it('reads a torrent client with its login, and no key', () => {
    expect(
      readDownloadClientForm({ ...FILLED, username: ' admin ', password: ' pw ', apiKey: 'x' }),
    ).toEqual({
      draft: {
        kind: 'qbittorrent',
        name: 'qBittorrent',
        url: 'http://qbittorrent:8080',
        username: 'admin',
        password: ' pw ',
        apiKey: '',
        category: 'valence',
        priority: 25,
        isEnabled: true,
      },
      problem: null,
    });
  });

  it('reads SABnzbd with its key, and no login', () => {
    expect(
      readDownloadClientForm({
        ...FILLED,
        kind: 'sabnzbd',
        username: 'x',
        password: 'y',
        apiKey: ' k ',
      }).draft,
    ).toMatchObject({ username: '', password: '', apiKey: 'k' });
  });

  it.each([
    [{ name: ' ' }, 'Give the client a name.'],
    [{ url: 'qbittorrent:8080' }, 'The address needs to be a whole http or https address.'],
    [{ url: 'ftp://qbittorrent' }, 'The address needs to be a whole http or https address.'],
    [
      { category: 'tv/films' },
      'The category is letters, numbers, spaces, dots, dashes and underscores.',
    ],
    [{ priority: '0' }, 'Priority is a whole number from 1 to 50.'],
  ])('says what is wrong with %o', (change, problem) => {
    expect(readDownloadClientForm({ ...FILLED, ...change })).toEqual({ draft: null, problem });
  });
});
