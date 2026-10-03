import { describe, expect, it } from 'vitest';
import { A_NEW_CLIENT } from './readDownloadClientForm';
import type { DownloadClientForm } from './readDownloadClientForm';
import { downloadClientFormSchema } from './downloadClientFormSchema';

const FILLED = { ...A_NEW_CLIENT, name: ' qBittorrent ', url: ' http://qbittorrent:8080 ' };

const read = (form: DownloadClientForm) => {
  const parsed = downloadClientFormSchema.safeParse(form);

  return parsed.success
    ? { draft: parsed.data, problem: null }
    : { draft: null, problem: parsed.error.issues[0]?.message ?? null };
};

describe('downloadClientFormSchema', () => {
  it('reads a torrent client with its login, and no key', () => {
    expect(read({ ...FILLED, username: ' admin ', password: ' pw ', apiKey: 'x' })).toEqual({
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
        remotePath: '',
        localPath: '',
        priority: 25,
        isEnabled: true,
      },
      problem: null,
    });
  });

  it('reads where the client and Valence each see the downloads folder', () => {
    expect(
      read({
        ...FILLED,
        remotePath: ' /downloads ',
        localPath: '/Users/marques/Downloads/Valence',
      }).draft,
    ).toMatchObject({ remotePath: '/downloads', localPath: '/Users/marques/Downloads/Valence' });
  });

  it('reads SABnzbd with its key, and no login', () => {
    expect(
      read({
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
    [{ url: 'qbittorrent:8080' }, 'Enter a full http or https address.'],
    [{ url: 'ftp://qbittorrent' }, 'Enter a full http or https address.'],
    [
      { categories: { ...A_NEW_CLIENT.categories, shows: 'tv/films' } },
      'A category can only contain letters, numbers, spaces, dots, dashes and underscores.',
    ],
    [
      { categories: { ...A_NEW_CLIENT.categories, shows: ' Valence-Films ' } },
      'Each media type needs its own category.',
    ],
    [
      { remotePath: '/downloads' },
      'Enter the downloads folder both as the client sees it and as Valence sees it, or leave both empty.',
    ],
    [{ priority: '0' }, 'Priority must be a whole number from 1 to 50.'],
  ])('says what is wrong with %o', (change, problem) => {
    expect(read({ ...FILLED, ...change })).toEqual({ draft: null, problem });
  });
});
