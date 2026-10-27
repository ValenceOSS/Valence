import { describe, expect, it } from 'vitest';
import { keepsItsFiles } from './keepsItsFiles';

describe('keepsItsFiles', () => {
  it('keeps a seeding torrent’s files, and lets a usenet download or a plugin’s copy be moved', () => {
    expect(keepsItsFiles('torrent', { kind: 'qbittorrent' })).toBe(true);
    expect(keepsItsFiles('usenet', { kind: 'sabnzbd' })).toBe(false);
    expect(keepsItsFiles('torrent', { kind: 'plugin' })).toBe(false);
  });
});
