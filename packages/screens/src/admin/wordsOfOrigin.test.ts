import { describe, expect, it } from 'vitest';
import { wordsOfOrigin } from '@ValenceScreens/admin/wordsOfOrigin';

describe('wordsOfOrigin', () => {
  it('says a file is linked to a download, and through which client', () => {
    expect(wordsOfOrigin({ source: 'download', via: 'qBittorrent', link: 'linked' })).toBe(
      'Linked to a download · qBittorrent',
    );
    expect(wordsOfOrigin({ source: 'handOff', via: 'Radarr', link: 'linked' })).toBe(
      'Linked to a download · Radarr',
    );
  });

  it('says a download that stands alone was downloaded, or fetched by the app it was handed to', () => {
    expect(wordsOfOrigin({ source: 'download', via: 'SABnzbd', link: 'alone' })).toBe(
      'Downloaded · SABnzbd',
    );
    expect(wordsOfOrigin({ source: 'download', via: null, link: null })).toBe('Downloaded');
    expect(wordsOfOrigin({ source: 'handOff', via: 'Sonarr', link: 'alone' })).toBe(
      'Fetched by Sonarr',
    );
  });

  it('says a file was uploaded, imported, or found on the disk', () => {
    expect(wordsOfOrigin({ source: 'upload', via: null, link: 'alone' })).toBe('Uploaded');
    expect(wordsOfOrigin({ source: 'import', via: 'Plex', link: 'alone' })).toBe(
      'Imported from Plex',
    );
    expect(wordsOfOrigin({ source: 'import', via: null, link: 'alone' })).toBe('Imported');
    expect(wordsOfOrigin({ source: 'disk', via: null, link: 'alone' })).toBe('Found on disk');
    expect(wordsOfOrigin({ source: 'disk', via: null, link: 'linked' })).toBe(
      'Found on disk · Linked to another copy',
    );
  });
});
