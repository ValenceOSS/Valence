import { describe, expect, it } from 'vitest';
import { aDownloadClient } from './aDownloadClient';

describe('aDownloadClient', () => {
  it('makes a switched-on qBittorrent, with what was changed', () => {
    expect(aDownloadClient({ name: 'Mine' })).toMatchObject({
      kind: 'qbittorrent',
      isEnabled: true,
      name: 'Mine',
    });
  });
});
