import { describe, expect, it } from 'vitest';
import {
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
  PROTOCOL_OF_CLIENT,
} from './DownloadClient';

describe('DownloadClientDraftSchema', () => {
  it('fills in what somebody adding a client need not decide', () => {
    expect(
      DownloadClientDraftSchema.parse({
        name: ' qBittorrent ',
        kind: 'qbittorrent',
        url: 'http://qbittorrent:8080',
      }),
    ).toEqual({
      name: 'qBittorrent',
      kind: 'qbittorrent',
      url: 'http://qbittorrent:8080',
      username: '',
      password: '',
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
    });
  });

  it('keeps a password exactly as typed, spaces and all', () => {
    expect(
      DownloadClientDraftSchema.parse({
        name: 'Transmission',
        kind: 'transmission',
        url: 'http://transmission:9091',
        password: ' spaced ',
      }).password,
    ).toBe(' spaced ');
  });

  it('refuses a category a client could not file things under', () => {
    expect(() =>
      DownloadClientDraftSchema.parse({
        name: 'SABnzbd',
        kind: 'sabnzbd',
        url: 'http://sabnzbd:8080',
        categories: { movies: 'tv/../films', shows: 'tv', music: 'music', books: 'books' },
      }),
    ).toThrow();
  });

  it('refuses two kinds sharing a category, whatever their case', () => {
    expect(() =>
      DownloadClientDraftSchema.parse({
        name: 'SABnzbd',
        kind: 'sabnzbd',
        url: 'http://sabnzbd:8080',
        categories: { movies: 'films', shows: 'Films', music: 'music', books: 'books' },
      }),
    ).toThrow('Each kind needs a category of its own');
  });

  it('refuses a kind it does not know', () => {
    expect(() =>
      DownloadClientDraftSchema.parse({ name: 'Deluge', kind: 'deluge', url: 'http://deluge' }),
    ).toThrow();
  });
});

describe('DownloadClientChangeSchema', () => {
  it('takes a change to one thing alone', () => {
    expect(DownloadClientChangeSchema.parse({ isEnabled: false })).toEqual({ isEnabled: false });
  });
});

describe('PROTOCOL_OF_CLIENT', () => {
  it('sends torrents to torrent clients and NZBs to usenet ones', () => {
    expect(PROTOCOL_OF_CLIENT).toEqual({
      qbittorrent: 'torrent',
      transmission: 'torrent',
      sabnzbd: 'usenet',
      nzbget: 'usenet',
    });
  });
});

describe('the folders a client and Valence each see', () => {
  it('drops a slash at the end, but keeps the root', () => {
    expect(
      DownloadClientChangeSchema.parse({ remotePath: ' /downloads/ ', localPath: '/' }),
    ).toEqual({ remotePath: '/downloads', localPath: '/' });
  });
});
