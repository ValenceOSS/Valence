import { describe, expect, it } from 'vitest';
import {
  A_NEW_CLIENT,
  choosingKind,
  formFor,
  readDownloadClientForm,
} from './readDownloadClientForm';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';

const KEPT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Seedbox',
  kind: 'transmission',
  url: 'http://seedbox:9091',
  username: 'me',
  hasPassword: true,
  hasApiKey: false,
  categories: { movies: 'films', shows: 'tv', music: 'music', books: 'books' },
  priority: 3,
  isEnabled: false,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const FILLED = { ...A_NEW_CLIENT, name: ' qBittorrent ', url: ' http://qbittorrent:8080 ' };

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
        categories: {
          movies: 'valence-films',
          shows: 'valence-series',
          music: 'valence-music',
          books: 'valence-books',
        },
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
      { categories: { ...A_NEW_CLIENT.categories, shows: 'tv/films' } },
      'A category is letters, numbers, spaces, dots, dashes and underscores.',
    ],
    [
      { categories: { ...A_NEW_CLIENT.categories, shows: ' Valence-Films ' } },
      'Each kind needs a category of its own.',
    ],
    [{ priority: '0' }, 'Priority is a whole number from 1 to 50.'],
  ])('says what is wrong with %o', (change, problem) => {
    expect(readDownloadClientForm({ ...FILLED, ...change })).toEqual({ draft: null, problem });
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
